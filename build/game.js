"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.AntColony = exports.Hive = exports.Place = exports.AntGame = void 0;
var ants_1 = require("../src/ants");
var Place = /** @class */ (function () {
    function Place(name, water, exit, entrance) {
        if (water === void 0) { water = false; }
        this.name = name;
        this.water = water;
        this.exit = exit;
        this.entrance = entrance;
        this.bees = [];
    }
    Place.prototype.getExit = function () { return this.exit; };
    Place.prototype.setEntrance = function (place) { this.entrance = place; };
    Place.prototype.isWater = function () { return this.water; };
    /**
     * Selects an ant to target, allowing a gaurd ant to take the place of the ant it is gaurding.
     *
     */
    Place.prototype.getAnt = function () {
        if (this.guard)
            return this.guard;
        else
            return this.ant;
    };
    Place.prototype.getGuardedAnt = function () {
        return this.ant;
    };
    Place.prototype.getBees = function () { return this.bees; };
    /**
     * Checks for the closest bee
     * @param maxDistance
     * @param minDistance
     * @returns closest bee : bee
     */
    Place.prototype.getClosestBee = function (maxDistance, minDistance) {
        if (minDistance === void 0) { minDistance = 0; }
        var p = this;
        for (var dist = 0; p !== undefined && dist <= maxDistance; dist++) {
            if (dist >= minDistance && p.bees.length > 0) {
                return p.bees[0];
            }
            p = p.entrance;
        }
        return undefined;
    };
    /**
     * Adds an instance of an ant to a set location.
     * @param ant
     * @returns
     */
    Place.prototype.addAnt = function (ant) {
        if (ant instanceof ants_1.GuardAnt) {
            if (this.guard === undefined) {
                this.guard = ant;
                this.guard.setPlace(this);
                return true;
            }
        }
        else if (this.ant === undefined) {
            this.ant = ant;
            this.ant.setPlace(this);
            return true;
        }
        return false;
    };
    /**
     * Removes a set ant from its location
     */
    Place.prototype.removeAnt = function () {
        if (this.guard !== undefined) {
            var guard = this.guard;
            this.guard = undefined;
            return guard;
        }
        else {
            var ant = this.ant;
            this.ant = undefined;
            return ant;
        }
    };
    /**
     * Adds a bee to the list of bees and sets its location
     * @param bee
     */
    Place.prototype.addBee = function (bee) {
        this.bees.push(bee);
        bee.setPlace(this);
    };
    /**
     * Removes a given bee from the list of bees and removes it from its set location.
     * @param bee
     */
    Place.prototype.removeBee = function (bee) {
        var index = this.bees.indexOf(bee);
        if (index >= 0) {
            this.bees.splice(index, 1);
            bee.setPlace(undefined);
        }
    };
    /**
     * Removes all bees from the list of bees and all locations.
     */
    Place.prototype.removeAllBees = function () {
        this.bees.forEach(function (bee) { return bee.setPlace(undefined); });
        this.bees = [];
    };
    /**
     * Removes a bee from its location and adds it to the exit.
     * @param bee
     */
    Place.prototype.exitBee = function (bee) {
        this.removeBee(bee);
        this.exit.addBee(bee);
    };
    /**
     * Removes both bees and ants from their given location.
     * @param insect
     */
    Place.prototype.removeInsect = function (insect) {
        if (insect instanceof ants_1.Ant) {
            this.removeAnt();
        }
        else if (insect instanceof ants_1.Bee) {
            this.removeBee(insect);
        }
    };
    /**
     * Removes ants unless they are scuba ants.
     */
    Place.prototype.act = function () {
        if (this.water) {
            if (this.guard) {
                this.removeAnt();
            }
            if (!(this.ant instanceof ants_1.ScubaAnt)) {
                this.removeAnt();
            }
        }
    };
    return Place;
}());
exports.Place = Place;
/**
 * Primary "place" where bees exist. Periodically releasing bees from the hive.
 */
var Hive = /** @class */ (function (_super) {
    __extends(Hive, _super);
    function Hive(beeArmor, beeDamage) {
        var _this = _super.call(this, 'Hive') || this;
        _this.beeArmor = beeArmor;
        _this.beeDamage = beeDamage;
        _this.waves = {};
        return _this;
    }
    /**
     * Creates a wave of bees and adds the wave the the larger list of all waves.
     * @param attackTurn
     * @param numBees
     * @returns this
     */
    Hive.prototype.addWave = function (attackTurn, numBees) {
        var wave = [];
        for (var i = 0; i < numBees; i++) {
            var bee = new ants_1.Bee(this.beeArmor, this.beeDamage, this);
            this.addBee(bee);
            wave.push(bee);
        }
        this.waves[attackTurn] = wave;
        return this;
    };
    /**
     * Removes bees from the current wave and places them into the ant colony, placing them randomly.
     * @param colony
     * @param currentTurn
     * @returns this.waves[currentTurn] | []
     */
    Hive.prototype.invade = function (colony, currentTurn) {
        var _this = this;
        if (this.waves[currentTurn] !== undefined) {
            this.waves[currentTurn].forEach(function (bee) {
                _this.removeBee(bee);
                var entrances = colony.getEntrances();
                var randEntrance = Math.floor(Math.random() * entrances.length);
                entrances[randEntrance].addBee(bee);
            });
            return this.waves[currentTurn];
        }
        else {
            return [];
        }
    };
    return Hive;
}(Place));
exports.Hive = Hive;
/**
 * Primary dwelling for ants and invasion site for bees.
 */
var AntColony = /** @class */ (function () {
    function AntColony(startingFood, numTunnels, tunnelLength, moatFrequency) {
        if (moatFrequency === void 0) { moatFrequency = 0; }
        this.places = [];
        this.beeEntrances = [];
        this.queenPlace = new Place('Ant Queen');
        this.boosts = { 'FlyingLeaf': 1, 'StickyLeaf': 1, 'IcyLeaf': 1, 'BugSpray': 0 };
        this.food = startingFood;
        var prev;
        for (var tunnel = 0; tunnel < numTunnels; tunnel++) //creates and occupies tunnels
         {
            var curr = this.queenPlace;
            this.places[tunnel] = [];
            for (var step = 0; step < tunnelLength; step++) {
                var typeName = 'tunnel';
                if (moatFrequency !== 0 && (step + 1) % moatFrequency === 0) {
                    //this makes sure the first tunnel is never a water tunnel
                    //after the first tunnel, a water tunnel is added ever X tunnels where X is moat Frequency
                    typeName = 'water';
                }
                prev = curr;
                var locationId = tunnel + ',' + step;
                curr = new Place(typeName + '[' + locationId + ']', typeName == 'water', prev);
                prev.setEntrance(curr);
                this.places[tunnel][step] = curr;
            }
            this.beeEntrances.push(curr); //adds bees to the current entrance
        }
    }
    AntColony.prototype.getFood = function () { return this.food; };
    AntColony.prototype.increaseFood = function (amount) { this.food += amount; };
    AntColony.prototype.getPlaces = function () { return this.places; };
    AntColony.prototype.getEntrances = function () { return this.beeEntrances; };
    AntColony.prototype.getQueenPlace = function () { return this.queenPlace; };
    AntColony.prototype.queenHasBees = function () { return this.queenPlace.getBees().length > 0; };
    AntColony.prototype.getBoosts = function () { return this.boosts; };
    /**
     * Adds a boost to the larger list of boosts available
     * @param boost
     */
    AntColony.prototype.addBoost = function (boost) {
        if (this.boosts[boost] === undefined) {
            this.boosts[boost] = 0;
        }
        this.boosts[boost] = this.boosts[boost] + 1;
        console.log('Found a ' + boost + '!');
    };
    /**
     * Adds an ant to a place as long as there is food and space for an ant to be deployed.
     * @param ant
     * @param place
     *
     */
    AntColony.prototype.deployAnt = function (ant, place) {
        if (this.food >= ant.getFoodCost()) {
            //if the player has enough food to deploy the type of any passed in, this code runs
            var success = place.addAnt(ant);
            if (success) {
                this.food -= ant.getFoodCost(); //the ant is "fed" its food cost
                return undefined;
            }
            return 'tunnel already occupied';
        }
        return 'not enough food';
    };
    /**
     * Removes an ant deom a given place in the hive.
     * @param place
     */
    AntColony.prototype.removeAnt = function (place) {
        place.removeAnt();
    };
    /**
     * Performs error checking before applying a set boost to a set ant.
     * @param boost
     * @param place
     * @returns
     */
    AntColony.prototype.applyBoost = function (boost, place) {
        if (this.boosts[boost] === undefined || this.boosts[boost] < 1) {
            return 'no such boost';
        }
        var ant = place.getAnt();
        if (!ant) {
            return 'no Ant at location';
        }
        ant.setBoost(boost);
        return undefined;
    };
    /**
     * Every instance of any kind of any performs its act() function respective to its class.
     */
    AntColony.prototype.antsAct = function () {
        var _this = this;
        this.getAllAnts().forEach(function (ant) {
            //loops for all ants in the game, invoking each ants .act function
            if (ant instanceof ants_1.GuardAnt) {
                var guarded = ant.getGuarded();
                if (guarded)
                    guarded.act(_this);
            }
            ant.act(_this);
        });
    };
    /**
     * A loop causing all bees to act.
     */
    AntColony.prototype.beesAct = function () {
        this.getAllBees().forEach(function (bee) {
            bee.act();
        });
    };
    /**
     * loops to perform all act() functions for all instances of a place.
     */
    AntColony.prototype.placesAct = function () {
        for (var i = 0; i < this.places.length; i++) {
            for (var j = 0; j < this.places[i].length; j++) {
                this.places[i][j].act();
            }
        }
    };
    /**
     * Finds and returns an array of all instances of an ant.
     * @returns ants:ant[]
     */
    AntColony.prototype.getAllAnts = function () {
        var ants = [];
        for (var i = 0; i < this.places.length; i++) {
            for (var j = 0; j < this.places[i].length; j++) {
                if (this.places[i][j].getAnt() !== undefined) {
                    ants.push(this.places[i][j].getAnt());
                }
            }
        }
        return ants;
    };
    /**
     * Finds and returns an array of all instances of a bee.
     * @returns bees: bee[]
     */
    AntColony.prototype.getAllBees = function () {
        var bees = [];
        for (var i = 0; i < this.places.length; i++) {
            for (var j = 0; j < this.places[i].length; j++) {
                bees = bees.concat(this.places[i][j].getBees());
            }
        }
        return bees;
    };
    return AntColony;
}());
exports.AntColony = AntColony;
/**
 * Primary game flow control of the game, in charge of iterating turns and deciding if the game is won.
 */
var AntGame = /** @class */ (function () {
    function AntGame(colony, hive) {
        this.colony = colony;
        this.hive = hive;
        this.turn = 0;
    }
    /**
     * Allows all insects and places to take their respective turns and increments the turn count.
     */
    AntGame.prototype.takeTurn = function () {
        console.log('');
        this.colony.antsAct();
        this.colony.beesAct();
        this.colony.placesAct();
        this.hive.invade(this.colony, this.turn);
        this.turn++;
        console.log('');
    };
    AntGame.prototype.getTurn = function () { return this.turn; };
    /**
     * Evaluates if the game as won, if the queen is being attacked by bees, the game is lost.
     * If all bees in both the colony and have are "dead", the game is won.
     * If neither are happening, the game is still ongoing.
     * @returns bool true if the game, false is won or lost | undefined if the game is still ongoing.
     */
    AntGame.prototype.gameIsWon = function () {
        if (this.colony.queenHasBees()) {
            return false;
        }
        else if (this.colony.getAllBees().length + this.hive.getBees().length === 0) {
            return true;
        }
        return undefined;
    };
    /**
     * Takes an antType and deploys it do a set location so long as the ant type is valid.
     * @param antType
     * @param placeCoordinates
     * @returns 'unknown ant type' | 'illegal location' in the case antType or placeCoordinates are invalid.
     */
    AntGame.prototype.deployAnt = function (antType, placeCoordinates) {
        var ant;
        switch (antType.toLowerCase()) {
            case "grower":
                ant = new ants_1.GrowerAnt();
                break;
            case "thrower":
                ant = new ants_1.ThrowerAnt();
                break;
            case "eater":
                ant = new ants_1.EaterAnt();
                break;
            case "scuba":
                ant = new ants_1.ScubaAnt();
                break;
            case "guard":
                ant = new ants_1.GuardAnt();
                break;
            default:
                return 'unknown ant type';
        }
        try {
            var coords = placeCoordinates.split(',');
            var place = this.colony.getPlaces()[coords[0]][coords[1]];
            return this.colony.deployAnt(ant, place);
        }
        catch (e) {
            return 'illegal location';
        }
    };
    /**
     * Removes an ant from a set location in the tunnels.
     * @param placeCoordinates
     * @returns undefined | 'illegal location'
     */
    AntGame.prototype.removeAnt = function (placeCoordinates) {
        try {
            var coords = placeCoordinates.split(',');
            var place = this.colony.getPlaces()[coords[0]][coords[1]];
            place.removeAnt();
            return undefined;
        }
        catch (e) {
            return 'illegal location';
        }
    };
    /**
     * Trys to apply a set boost to a set ant.
     * @param boostType
     * @param placeCoordinates
     * @returns this.colony.applyBoost(boostType,place) | 'illegal location'
     */
    AntGame.prototype.boostAnt = function (boostType, placeCoordinates) {
        try {
            var coords = placeCoordinates.split(',');
            var place = this.colony.getPlaces()[coords[0]][coords[1]];
            return this.colony.applyBoost(boostType, place);
        }
        catch (e) {
            return 'illegal location';
        }
    };
    AntGame.prototype.getPlaces = function () { return this.colony.getPlaces(); };
    AntGame.prototype.getFood = function () { return this.colony.getFood(); };
    AntGame.prototype.getHiveBeesCount = function () { return this.hive.getBees().length; };
    /**
     * Finds and returns a lost of all boost names for boosts that a colony has.
     */
    AntGame.prototype.getBoostNames = function () {
        var boosts = this.colony.getBoosts();
        return Object.keys(boosts).filter(function (boost) {
            return boosts[boost] > 0;
        });
    };
    return AntGame;
}());
exports.AntGame = AntGame;
