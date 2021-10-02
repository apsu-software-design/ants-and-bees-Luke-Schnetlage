"use strict";
/* Note for grader:
Alot of these external libraries  are stupid, but by god, if the assignment says “one comment per line”,
it says “one comment per line”
*/
exports.__esModule = true;
exports.play = exports.showMapOf = void 0;
var vorpal = require("vorpal");
/*
Vorpal is a library designed to create immersive command line applications.
*/
var chalk = require("chalk");
/*
Chalk is primarily for giving aditional display options for text in the terminal.
For example, the yellow color of the bee "B" and bold fonts come from chalk functions.
*/
var _ = require("lodash");
/*
lodash is also a library focused on improved command line interaction.
*/
/**
 * The Vorpal library for command-line interaction
 */
var Vorpal = vorpal();
function showMapOf(game) {
    console.log(getMap(game));
}
exports.showMapOf = showMapOf;
/**
 * Creates and returns a string 'map' that is an ascii representation of several tunnels, some with water, some without.
 * @param game
 * @returns map
 */
function getMap(game) {
    var places = game.getPlaces();
    var tunnelLength = places[0].length;
    var beeIcon = chalk.bgYellow.black('B');
    var map = '';
    //chalk adds a bold text warning to the map
    map += chalk.bold('The Colony is under attack!\n');
    map += "Turn: " + game.getTurn() + ", Food: " + game.getFood() + ", Boosts available: [" + game.getBoostNames() + "]\n";
    map += '     ' + _.range(0, tunnelLength).join('    ') + '      Hive' + '\n';
    for (var i = 0; i < places.length; i++) {
        map += '    ' + Array(tunnelLength + 1).join('=====');
        if (i === 0) {
            map += '    ';
            var hiveBeeCount = game.getHiveBeesCount();
            if (hiveBeeCount > 0) {
                map += beeIcon;
                map += (hiveBeeCount > 1 ? hiveBeeCount : ' ');
            }
        }
        map += '\n';
        map += i + ')  ';
        for (var j = 0; j < places[i].length; j++) {
            var place = places[i][j];
            map += iconFor(place.getAnt());
            map += ' ';
            if (place.getBees().length > 0) {
                map += beeIcon;
                map += (place.getBees().length > 1 ? place.getBees().length : ' ');
            }
            else {
                map += '  ';
            }
            map += ' ';
        }
        map += '\n    ';
        for (var j = 0; j < places[i].length; j++) {
            var place = places[i][j];
            if (place.isWater()) {
                //using chalk, water is drawn as cyan in the command line for visual clarity
                map += chalk.bgCyan('~~~~') + ' ';
            }
            else {
                map += '==== ';
            }
        }
        map += '\n';
    }
    map += '     ' + _.range(0, tunnelLength).join('    ') + '\n';
    return map;
}
/**
 * A function that takes a given ant and returns the symbol associate with its given type. Should the type be unrecognized,
 * the ant will be symbolized by a '?'.
 * @param ant : Ant
 * @returns icon : string
 */
function iconFor(ant) {
    if (ant === undefined) {
        return ' ';
    }
    ;
    var icon;
    switch (ant.name) {
        case "Grower":
            //Using chalk, grower ants are drawn as a green 'G'
            icon = chalk.green('G');
            break;
        case "Thrower":
            //Using chalk, thrower ants are drawn as a red 'T'
            icon = chalk.red('T');
            break;
        case "Eater":
            if (ant.isFull())
                //Using chalk, full eater ants are drawn as a yellow 'E'
                icon = chalk.yellow.bgMagenta('E');
            else
                //If an eater ant has an empty stomach, it will be drawn with the same 'E', however, its color will be magenta
                icon = chalk.magenta('E');
            break;
        case "Scuba":
            //Draws scuba ants as a cyan capital 'S'
            icon = chalk.cyan('S');
            break;
        case "Guard":
            var guarded = ant.getGuarded();
            if (guarded) {
                //adds an underline below an ant to show it is gaurded by a gaurd ant.
                icon = chalk.underline(iconFor(guarded));
                break;
            }
            else {
                //Should a gaurd ant be placed in a location with no ant to gaurd, will will unstead be drawn as an underlined 'x'
                icon = chalk.underline('x');
                break;
            }
        default:
            //If an ant type is unrecognized, it will be represented by a '?'
            icon = '?';
    }
    return icon;
}
/**
 * This function broadly accepts user input and triggers the appropriate game action.
 * It also triggers the final command to truely draw the appropriate characters to the terminal.
 * @param game
 */
function play(game) {
    Vorpal
        .delimiter(chalk.green('AvB $'))
        //delimiter prompts for user input while expressing a string
        //In this case, the string is 'AvB $', using chalk, the string in shown in green
        //this is the basic user input prompt 
        .log(getMap(game))
        //log does exactly what it sounds like, this expresses the map created in getMap
        .show();
    //show also does what it sounds like, it shows what has been logged
    Vorpal
        .command('show', 'Shows the current game board.')
        //creates a new command named show with a parent of 'Shows the current game board.'
        //the user will now be able to enter the command  'show' on the console to trigger the action associated with it
        //show displays a new instance of the game map
        .action(function (args, callback) {
        //action binds the function getmap to the command show, so the user can input show to the consol and will be shown the gameboard
        Vorpal.log(getMap(game));
        callback();
    });
    Vorpal
        .command('deploy <antType> <tunnel>', 'Deploys an ant to tunnel (as "row,col" eg. "0,6").')
        //creates a new command with the name 'deploy <antType> <tunnel>'
        //deploy allows to user to place an ant to a specific location
        .alias('add', 'd')
        //allows the command deploy to also be called with 'add' or 'd'
        .autocomplete(['Grower', 'Thrower', 'Eater', 'Scuba', 'Guard'])
        //uses the autocomplete function so users can input partial strings and their "bad" input will be corrected to a valid string
        .action(function (args, callback) {
        //this binds the following code to the command 'deploy' (also 'd' and 'add')
        var error = game.deployAnt(args.antType, args.tunnel);
        //basic error catching incase the location or ant to be deployed is invalid
        if (error) {
            //logs the error message to be displayed
            Vorpal.log("Invalid deployment: " + error + ".");
        }
        else {
            Vorpal.log(getMap(game));
            //The new map is displayed
        }
        callback();
        //callback allows this command to be passed as a function
    });
    Vorpal
        .command('remove <tunnel>', 'Removes the ant from the tunnel (as "row,col" eg. "0,6").')
        //creates another command, in this case named 'remove' that accepts <tunnel>
        //remove removes an ant from a tunnel
        .alias('rm')
        //allows remove to also be called by 'rm'
        .action(function (args, callback) {
        //binds the following code to the function remove
        var error = game.removeAnt(args.tunnel);
        //error checking incase the location to be purged of ants is invalid
        if (error) {
            Vorpal.log("Invalid removal: " + error + ".");
        }
        else {
            Vorpal.log(getMap(game));
            //adds a new, updated instance of the game map to be displayed to the log
        }
        callback();
    });
    Vorpal
        .command('boost <boost> <tunnel>', 'Applies a boost to the ant in a tunnel (as "row,col" eg. "0,6")')
        //creates a command boost
        //boost applies a specified boost to an ant
        .alias('b')
        //allows boost to be called by 'b'
        .autocomplete({ data: function () { return game.getBoostNames(); } })
        //autocompletes incomplete boost names typed by the user
        //*ie bug becomes bugSpray
        .action(function (args, callback) {
        var error = game.boostAnt(args.boost, args.tunnel);
        //error detection in the case autocomplete is unable to find a valid boost based on user input
        if (error) {
            Vorpal.log("Invalid boost: " + error);
        }
        callback();
    });
    Vorpal
        .command('turn', 'Ends the current turn. Ants and bees will act.')
        //creates a command turn
        //turn ends the players turn and all insects and places will perform their relative actions
        .alias('end turn', 'take turn', 't')
        //allows tunr to be called by 'end turn', 'take turn', and 't'
        .action(function (args, callback) {
        game.takeTurn();
        Vorpal.log(getMap(game));
        var won = game.gameIsWon();
        //checks if the user won, lost, or is still playing
        if (won === true) {
            //if the user won, display victory message
            Vorpal.log(chalk.green('Yaaaay---\nAll bees are vanquished. You win!\n'));
        }
        else if (won === false) {
            //if the user lost, display the defeat message
            Vorpal.log(chalk.yellow('Bzzzzz---\nThe ant queen has perished! Please try again.\n'));
        }
        else {
            callback();
        }
    });
}
exports.play = play;
