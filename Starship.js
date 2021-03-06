let ship = {
    "captain":0,
    "engineer":0,
    "gunner":0,
    "pilot":1,
    "science":2,
    "name":"Sunrise Maiden",
    "tier":3,
};

let shipWeapons = {
    "flakthrower":{"name":"Flak Thrower", "damage":"3d4"},
    "gyrolaser":{"name":"Gyrolaser", "damage":"1d8"},
    "lightlasercannon":{"name":"Light Laser Cannon", "damage":"2d4"},
    "lightparticlebeam":{"name":"Light Particle Beam", "damage":"3d6"},
};

let shipSkillList = {"acrobatics":"dexterity", "athletics":"strength", 
    "bluff":"charisma", "computers":"intelligence", "culture":"intelligence", 
    "diplomacy":"charisma", "disguise":"charisma", "engineering":"intelligence", 
    "intimidate":"charisma", "lifescience":"intelligence", "medicine":"intelligence", 
    "mysticism":"wisdom", "perception":"wisdom", "physicalscience":"intelligence", 
    "piloting":"dexterity", "profession00":"unknown", "profession01":"unknown", 
    "sensemotive":"wisdom", "sleightofhand":"dexterity", "stealth":"dexterity", 
    "survival":"wisdom",
};

let stuntDcs = {
    "backoff":10 + 1.5 * ship["tier"],
    "barrelroll":10 + 1.5 * ship["tier"],
    "evade":10 + 1.5 * ship["tier"],
    "flipandburn":15 + 1.5 * ship["tier"],
    "flyby":"15 + 1.5 * Enemy Ship Tier",
    "slide":10 + 1.5 * ship["tier"],
};

let stuntName = {
    "backoff":"Back Off",
    "barrelroll":"Barrel Roll",
    "evade":"Evade",
    "flipandburn":"Flip and Burn",
    "flyby":"Fly By",
    "slide":"Slide",
};

function rollShipCheck(char, role, action, skill, chatBonus, dc){
    let attBonus = 0, skRanks = 0, skBonus = 0, totalBonus = 0;
    // Get skill bonus from attributes
    skBonus = parseInt(getAttrByName(char.get("id"), "skill-" + skill, "max"));
    if(isNaN(skBonus)) skBonus = 0;
    // Get skill ranks
    skRanks = parseInt(getAttrByName(char.get("id"), "skill-" + skill, "current"));
    if(isNaN(skRanks)) skRanks = 0;
    // get attribute bonus
    attBonus = parseInt(Math.floor(getAttrByName(char.get("id"), "attribute-" + skillList[skill])-10)/2);
    if(isNaN(attBonus)) attBonus = 0;
    totalBonus = skBonus + skRanks + attBonus + chatBonus;
    
    log("Starship / rollCheck / Character: " + char.get("name"));
    log("Starship / rollCheck / skBonus: " + skBonus);
    log("Starship / rollCheck / skRanks: " + skRanks);
    log("Starship / rollCheck / attBonus: " + attBonus);
    log("Starship / rollCheck / chatBonus: " + chatBonus);
    
    sendMessage(char, null, "&{template:default} {{name=" + char.get("name") + " / " + role + 
        "}} {{" + action + " Check=[[1d20+" + totalBonus + "]]}} {{DC=" + dc + "}}");
}

function rollGunneryCheck(char, action, weapon, chatBonus){
    let attBonus = 0, totalBonus = 0;
    let pOrBab = 0;
    // Set pOrBab to piloting ranks
    pOrBab = parseInt(getAttrByName(char.get("id"), "skill-piloting", "current"));
    // If BAB is higher than piloting ranks, update pOrBab
    let bab = parseInt(getAttrByName(char.get("id"), "baseattackbonus", "current"));
    if(bab > pOrBab) pOrBab = bab;
    
    // get attribute bonus
    attBonus = parseInt(Math.floor(getAttrByName(char.get("id"), "attribute-dexterity") - 10)/2);
    if(isNaN(attBonus)) attBonus = 0;
    totalBonus = pOrBab + attBonus + chatBonus + ship["gunner"];
    
    log("Starship / rollGunneryCheck / Character: " + char.get("name"));
    log("Starship / rollGunneryCheck / pOrBab: " + pOrBab);
    log("Starship / rollGunneryCheck / attBonus: " + attBonus);
    log("Starship / rollGunneryCheck / chatBonus: " + chatBonus);
    
    sendMessage(char, null, "&{template:default} {{name=" + char.get("name") + " / Gunner}} {{Weapon=" + 
        shipWeapons[weapon]["name"] + "}} {{" + action + " Check=[[1d20+" + totalBonus + "]]}} {{Damage=[[" +
        shipWeapons[weapon]["damage"] + "]]}}");
}

function charLevel(character){
    return getAttrByName(character.get("id"), "characterlevel");
}

function charRank(character, skill){
    return getAttrByName(character.get("id"), "skill-" + skill, "current");
}

function errorBadBonus(input, character){
    sendMessage(getChar("Clippy"), character, "Yo - imma roll this check for you, " + 
        "but I'm not including the bonus you typed. I don't recognize this: " + 
        input);
}

function levelTooLow(character, level, required){
    sendMessage(getChar("Clippy"), character, "Nice try! You've gotta be level " +
        required + " to do that...you're level " + level);
}

function rankTooLow(character, rank, required){
    sendMessage(getChar("Clippy"), character, "Nice try! You've gotta have " +
        required + " ranks to do that...you've got " + rank);
}

function errorBadAction(action, role, character){
    let actionString = "a";
    switch(role){
        case "captain":
            actionString += " Captain";
            break;
        case "engineer":
            actionString += "n Engineer";
            break;
        case "gunner":
            actionString += " Gunner";
            break;
        case "pilot":
            actionString += " Pilot";
            break;
        case "science":
            actionString += " Science Officer";
            break;
    }
    actionString += " action.";
    sendMessage(getChar("Clippy"), character, "No no. No. No no no no no. " +
        "Nooooooooope. '" + action + "' is not " + actionString);
}

// Syntax: !ship [SKILL_NAME] [optional modifier]
// Example: !ship gunner-shoot-bab +2
// Example: !ship science-scan
on("chat:message", function(msg){
    if(msg.type != "api") return;
    
    if(msg.content.indexOf("!ship ") !== -1){
        let char = getChar(msg.who);
        let chatBonus = 0, skBonus = 0, skRanks = 0, attBonus = 0;
        let skillName = "";
        // Check for valid character
        if(char == null) {
            sendMessage(getChar("Clippy"), null, "Who just tried to use a ship command?" +
                " I don't know youuuuuuu!");
            return;
        }
        let rawInput = msg.content.replace("!ship ", "");
        // Make sure there is something listed where the skill should be
        if(rawInput.length <= 0) return;
        let input = rawInput.split(" ");
        skillName = input[0];
        // Check for bonus typed into chat
        /*
        if(input[1] != undefined){
            intSubString = parseInt(input[1].slice(1));
            if(input[1].charAt(0) == '+' ){
                if(intSubString){
                    chatBonus = intSubString;
                }else errorBadBonus(input[1], char);
            }else if(input[1].charAt(0) == '-'){
                if(intSubString){
                    chatBonus = -intSubString;
                }else errorBadBonus(input[1], char);
            }else{
                errorBadBonus(input[1], char);
            }
        }*/
        // Check for valid ship skill name and action
        let role = input[0].split("-")[0];
        let action = input[0].split("-")[1];
        let option = input[0].split("-")[2];
        log("Starship / role: " + role);
        log("Starship / action: " + action);
        log("Starship / option: " + option);
        if(action == undefined){
            sendMessage(getChar("Clippy"), char, "I didn't hear any actions in there. You said: " + input);
            return;
        }
        
        switch(role){
            case "captain":
                switch(action){
                    case "movingspeech":
                        if (charLevel(char) >= 12){
                            sendMessage(getChar("Clippy"), char, "Hey - you actually got the syntax, right! Too bad this action isn't programmed, yet.");
                            break;
                        }else{
                            levelTooLow(char, charLevel(char), 12);
                            sendMessage(getChar("Clippy"), char, "Hey - you actually got the syntax, right! Too bad this action isn't programmed, yet.");
                            break;
                        }
                        break;
                    case "orders":
                        if (charLevel(char) >= 6){
                            sendMessage(getChar("Clippy"), char, "Hey - you actually got the syntax, right! Too bad this action isn't programmed, yet.");
                            break;
                        }else{
                            rankTooLow(char, charLevel(char), 6);
                            break;
                        }
                        break;
                    case "taunt":
                        if(option == undefined){
                            sendMessage(getChar("Clippy"), char, "You're missing the skill option for this check.");
                            break;
                        }
                        rollShipCheck(char, "Captain", "Taunt", option, 0, "15 + 1.5 * Enemy Ship Tier");
                        break;
                    case "encourage":
                        if(option == undefined){
                            sendMessage(getChar("Clippy"), char, "You're missing the skill option for this check.");
                            break;
                        }
                        rollShipCheck(char, "Captain", "Encourage", option, 0, (option == "diplomacy") ? 15+ship["tier"] : 10);
                        break;
                    case "demand":
                        rollShipCheck(char, "Captain", "Demand", "intimidate", 0, 15 + 1.5 * ship["tier"]);
                        break;
                    default:
                        errorBadAction(action, role, char);
                        return;
                }
                break;
            case "engineer":
                switch(action){
                    case "quickfix":
                        if (charRank(char, "engineering") >= 12){
                            // do the action
                        }else{
                            rankTooLow(char, charRank(char, "engineering"), 12);
                            break;
                        }
                        break;
                    case "overpower":
                        if (charRank(char, "engineering") >= 6){
                            // do the action
                        }else{
                            rankTooLow(char, charRank(char, "engineering"), 6);
                            break;
                        }
                        break;
                    case "patch":
                        rollShipCheck(char, "Engineer", "Patch", "engineering", 0, "[Check Here](http://journal.roll20.net/handout/-Kx6XXnQdz_gPlUFIdXF)");
                        break;
                    case "holdittogether":
                        rollShipCheck(char, "Engineer", "Hold It Together", "engineering", 0, 15 + 1.5 * ship["tier"]);
                        break;
                    case "divert":
                        rollShipCheck(char, "Engineer", "Divert", "engineering", 0, 10 + 1.5 * ship["tier"]);
                        break;
                    default:
                        errorBadAction(action, role, char);
                        return;
                }
                break;
            case "gunner":
                switch(action){
                    case "precisetargeting":
                        if (charLevel(char) >= 12){
                            // do the action
                        }else{
                            levelTooLow(char, charLevel(char), 12);
                            break;
                        }
                        break;
                    case "broadside":
                        if (charLevel(char) >= 6){
                            // do the action
                        }else{
                            levelTooLow(char, charLevel(char), 6);
                            break;
                        }
                        break;
                    case "shoot":
                        if(!option){
                            sendMessage(getChar("Clippy"), char, "You're missing the weapon for this check.");
                            break;
                        }
                        rollGunneryCheck(char, "Shoot", option, 0);
                        break;
                    case "fireatwill":
                        if(!option){
                            sendMessage(getChar("Clippy"), char, "You're missing the weapon for this check.");
                            break;
                        }
                        rollGunneryCheck(char, "Fire at Will", option, -4);
                        rollGunneryCheck(char, "Fire at Will", option, -4);
                        break;
                    default:
                        errorBadAction(action, role, char);
                        return;
                }
                break;
            case "pilot":
                switch(action){
                    case "audaciousgambit":
                        if (charRank(char, "piloting") >= 12){
                            // do the action
                        }else{
                            rankTooLow(char, charRank(char, "piloting"), 12);
                            break;
                        }
                        break;
                    case "fullpower":
                        if (charRank(char, "piloting") >= 6){
                            // do the action
                        }else{
                            rankTooLow(char, charRank(char, "piloting"), 6);
                            break;
                        }
                        break;
                    case "stunt":
                        if(option == undefined){
                            sendMessage(getChar("Clippy"), char, "You're missing the stunt option for this check.");
                            break;
                        }
                        rollShipCheck(char, "Pilot", stuntName[option], "piloting", 0, stuntDcs[option]);
                        break;
                    case "maneuver":
                        rollShipCheck(char, "Pilot", "Maneuver", "piloting", 0, 15 + 1.5 * ship["tier"]);
                        break;
                    case "fly":
                        rollShipCheck(char, "Pilot", "Fly", "piloting", 0, "None");
                        break;
                    default:
                        errorBadAction(action, role, char);
                        return;
                }
                break;
            case "science":
                switch(action){
                    case "improvecountermeasures":
                        if (charRank(char, "computers") >= 12){
                            // do the action
                        }else{
                            rankTooLow(char, charRank(char, "computers"), 12);
                            break;
                        }
                        break;
                    case "lockon":
                        if (charRank(char, "computers") >= 6){
                            // do the action
                        }else{
                            rankTooLow(char, charRank(char, "computers"), 6);
                            break;
                        }
                        break;
                    case "targetsystem":
                        rollShipCheck(char, "Science Officer", "Target System", "computers", 0, "5 + (1.5 * Enemy Ship Tier) + Enemy Countermeasures");
                        break;
                    case "scan":
                        rollShipCheck(char, "Science Officer", "Scan", "computers", 0, "5 + (1.5 * Enemy Ship Tier) + Enemy Countermeasures");
                        break;
                    case "balance":
                        rollShipCheck(char, "Science Officer", "Balance", "computers", 0, 10 + 1.5 * ship["tier"]);
                        break;
                    default:
                        errorBadAction(action, role, char);
                        return;
                }
                break;
            default:
                sendMessage(getChar("Clippy"), char, "Do you even know what " +
                    "your role on this ship is? What in the world is: " + role + "?");
                return;
        }
    }
});
