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
exports.GuardAnt = exports.ScubaAnt = exports.EaterAnt = exports.ThrowerAnt = exports.GrowerAnt = exports.Ant = exports.Bee = exports.Insect = void 0;
var game_1 = require("../src/game");
/**
 * The abstract Insect class that bee and ant extend from.
 *
 *
 */
var Insect = /** @class */ (function () {
    function Insect(armor, place) {
        this.armor = armor;
        this.place = place;
    }
    Insect.prototype.getName = function () { return this.name; };
    Insect.prototype.getArmor = function () { return this.armor; };
    Insect.prototype.getPlace = function () { return this.place; };
    Insect.prototype.setPlace = function (place) { this.place = place; };
    /**
     * Removes armor from an insect, "killing" them in the run out of armor. Returns true if the insect dies, otherwise false.
     * @param amount:number
     * @returns boolean
     */
    Insect.prototype.reduceArmor = function (amount) {
        this.armor -= amount;
        if (this.armor <= 0) {
            //a simple operation to remove insects with no armor and are therefore "dead"
            console.log(this.toString() + ' ran out of armor and expired');
            this.place.removeInsect(this);
            return true;
        }
        return false;
    };
    Insect.prototype.toString = function () {
        return this.name + '(' + (this.place ? this.place.name : '') + ')';
    };
    return Insect;
}());
exports.Insect = Insect;
/**
 * Bee class capible of stinging ants and acting.
 *
 */
var Bee = /** @class */ (function (_super) {
    __extends(Bee, _super);
    function Bee(armor, damage, place) {
        var _this = _super.call(this, armor, place) || this;
        _this.damage = damage;
        _this.name = 'Bee';
        return _this;
    }
    /**
     * Sting Function, the bee stings an ant and deals damage to the ants armor, killing it if damage is greater than armor.
     * @param ant:Ant
     * @returns boolean
     */
    Bee.prototype.sting = function (ant) {
        console.log(this + ' stings ' + ant + '!');
        return ant.reduceArmor(this.damage);
    };
    Bee.prototype.isBlocked = function () {
        return this.place.getAnt() !== undefined;
    };
    Bee.prototype.setStatus = function (status) { this.status = status; };
    /**
     * Primary action selection for a given bee. If a bee is blocked, it will sting its blocker, if it is not blocked, it exit its location.
     * A bee that exits the colony will enter the queens domain and attack her, making the player lose the game.
     * Both of these actions are influenced by statuses influcted by boosts.
     * Cold bees are unable to string and stuck bees are unable to exit.
     *
     */
    Bee.prototype.act = function () {
        if (this.isBlocked()) {
            if (this.status !== 'cold') {
                this.sting(this.place.getAnt());
            }
        }
        else if (this.armor > 0) {
            if (this.status !== 'stuck') {
                this.place.exitBee(this);
            }
        }
        this.status = undefined;
    };
    return Bee;
}(Insect));
exports.Bee = Bee;
/**
 * The base abstract ant class all other ants extend from.
 */
var Ant = /** @class */ (function (_super) {
    __extends(Ant, _super);
    function Ant(armor, foodCost, place) {
        if (foodCost === void 0) { foodCost = 0; }
        var _this = _super.call(this, armor, place) || this;
        _this.foodCost = foodCost;
        return _this;
    }
    Ant.prototype.getFoodCost = function () { return this.foodCost; };
    Ant.prototype.setBoost = function (boost) {
        this.boost = boost;
        console.log(this.toString() + ' is given a ' + boost);
    };
    return Ant;
}(Insect));
exports.Ant = Ant;
/**
 * Grower ant capable of growing food and occasionally finding boosts.
 */
var GrowerAnt = /** @class */ (function (_super) {
    __extends(GrowerAnt, _super);
    function GrowerAnt() {
        var _this = _super.call(this, 1, 1) || this;
        _this.name = "Grower";
        return _this;
    }
    /**
     * Random table to determine what a given ant "grows" in a turn. The most likely result being food, followed by the leaf based boosts,
     * finally followed by the rarest boost, bugspray.
     * @param colony
     */
    GrowerAnt.prototype.act = function (colony) {
        var roll = Math.random();
        if (roll < 0.6) {
            colony.increaseFood(1);
        }
        else if (roll < 0.7) {
            colony.addBoost('FlyingLeaf');
        }
        else if (roll < 0.8) {
            colony.addBoost('StickyLeaf');
        }
        else if (roll < 0.9) {
            colony.addBoost('IcyLeaf');
        }
        else if (roll < 0.95) {
            colony.addBoost('BugSpray');
        }
    };
    return GrowerAnt;
}(Ant));
exports.GrowerAnt = GrowerAnt;
/**
 * Thrower ant class capable of throwing "normal" leaves to deal damage to bees or boosts for a special effect.
 *
 */
var ThrowerAnt = /** @class */ (function (_super) {
    __extends(ThrowerAnt, _super);
    function ThrowerAnt() {
        var _this = _super.call(this, 1, 4) || this;
        _this.name = "Thrower";
        _this.damage = 1;
        return _this;
    }
    /**
     * Primary decision tree for thrower ants. If using a standard or flying leaf, deals damage to the closest bee to a given ant.
     * If given a sticky leaf or icy leaf, inflicts status effect to the closest bee.
     * If bugspray is given to an ant, it will spray the entire tunnel, dealing 10 damage to all insects in its tunnel, including itself.
     */
    ThrowerAnt.prototype.act = function () {
        if (this.boost !== 'BugSpray') {
            //so long as the ant isn't given bugspray, it will look for the closest ant within a range, then throw its leaf.
            var target = void 0;
            if (this.boost === 'FlyingLeaf')
                target = this.place.getClosestBee(5);
            else
                target = this.place.getClosestBee(3);
            if (target) {
                console.log(this + ' throws a leaf at ' + target);
                target.reduceArmor(this.damage);
                if (this.boost === 'StickyLeaf') {
                    target.setStatus('stuck');
                    console.log(target + ' is stuck!');
                }
                if (this.boost === 'IcyLeaf') {
                    target.setStatus('cold');
                    console.log(target + ' is cold!');
                }
                this.boost = undefined;
            }
        }
        else {
            // this code will only execute if bugspray is used. It finds the closest bee, reduces its armor until it dies, then repeats until
            // no more bees remain to be targeted, after all bees are removed, the thrower ant will take 10 damage and die aswell.
            console.log(this + ' sprays bug repellant everywhere!');
            var target = this.place.getClosestBee(0);
            while (target) {
                target.reduceArmor(10);
                target = this.place.getClosestBee(0);
            }
            this.reduceArmor(10);
        }
    };
    return ThrowerAnt;
}(Ant));
exports.ThrowerAnt = ThrowerAnt;
/**
 * Eater ant class capible of eating bees, one at a time, over the course of several turns. Should an eater ant die with a bee still
 * in its stomach, it will cough up the bee. The bee will go back to its normal behavior.
 */
var EaterAnt = /** @class */ (function (_super) {
    __extends(EaterAnt, _super);
    function EaterAnt() {
        var _this = _super.call(this, 2, 4) || this;
        _this.name = "Eater";
        _this.turnsEating = 0;
        _this.stomach = new game_1.Place('stomach');
        return _this;
    }
    EaterAnt.prototype.isFull = function () {
        return this.stomach.getBees().length > 0;
    };
    /**
     * Primary decision tree for eater ants.
     * If the ant is not difesting a bee, it will look for a bee to eat. If it is already eating a bee, it will increment each turn
     * until the bee is fully eaten or the ant dies. If the ant dies, it will cough up the bee it was eating.
     */
    EaterAnt.prototype.act = function () {
        console.log("eating: " + this.turnsEating);
        if (this.turnsEating == 0) {
            console.log("try to eat");
            var target = this.place.getClosestBee(0);
            if (target) {
                console.log(this + ' eats ' + target + '!');
                this.place.removeBee(target);
                this.stomach.addBee(target);
                this.turnsEating = 1;
            }
        }
        else {
            if (this.turnsEating > 3) {
                this.stomach.removeBee(this.stomach.getBees()[0]);
                this.turnsEating = 0;
            }
            else
                this.turnsEating++;
        }
    };
    /**
     * A function to deal damage to an eater ant and trigger any appropriate side effects should the ant die.
     * If the eater ant dies before fully digesting the bee it is eating, it will "cough up" the bee, allowing it to continue fighting.
     * @param amount : number
     * @returns boolen
     */
    EaterAnt.prototype.reduceArmor = function (amount) {
        this.armor -= amount;
        console.log('armor reduced to: ' + this.armor);
        if (this.armor > 0) {
            //If an eater ant does not die, but does take damage, this code will execute.
            if (this.turnsEating == 1) {
                //should an eater ant take damage the turn after it eats a bee, it will cough it back up
                var eaten = this.stomach.getBees()[0];
                this.stomach.removeBee(eaten);
                this.place.addBee(eaten);
                console.log(this + ' coughs up ' + eaten + '!');
                this.turnsEating = 3;
            }
        }
        else if (this.armor <= 0) {
            //if an eater ant dies, this code will execute
            if (this.turnsEating > 0 && this.turnsEating <= 2) {
                //if an eater ant dies and the bee was not fully digested in 3 turns, it will be coughed up.
                var eaten = this.stomach.getBees()[0];
                this.stomach.removeBee(eaten);
                this.place.addBee(eaten);
                console.log(this + ' coughs up ' + eaten + '!');
            }
            return _super.prototype.reduceArmor.call(this, amount);
        }
        return false;
    };
    return EaterAnt;
}(Ant));
exports.EaterAnt = EaterAnt;
/**
 * Scuba ant class, capible of all actions the thrower ant is. The meaningful difference between the scuba and thrower ant is their interaction with water.
 * Thrower ants are unable to function in water flooded tunnels while scuba ants are unaffected by water.
 */
var ScubaAnt = /** @class */ (function (_super) {
    __extends(ScubaAnt, _super);
    function ScubaAnt() {
        var _this = _super.call(this, 1, 5) || this;
        _this.name = "Scuba";
        _this.damage = 1;
        return _this;
    }
    /**
     * Primary decision tree for scuba ants. If using a standard or flying leaf, deals damage to the closest bee to a given ant.
     * If given a sticky leaf or icy leaf, inflicts status effect to the closest bee.
     * If bugspray is given to an ant, it will spray the entire tunnel, dealing 10 damage to all insects in its tunnel, including itself.
     */
    ScubaAnt.prototype.act = function () {
        if (this.boost !== 'BugSpray') {
            var target = void 0;
            if (this.boost === 'FlyingLeaf')
                target = this.place.getClosestBee(5);
            else
                target = this.place.getClosestBee(3);
            if (target) {
                console.log(this + ' throws a leaf at ' + target);
                target.reduceArmor(this.damage);
                if (this.boost === 'StickyLeaf') {
                    target.setStatus('stuck');
                    console.log(target + ' is stuck!');
                }
                if (this.boost === 'IcyLeaf') {
                    target.setStatus('cold');
                    console.log(target + ' is cold!');
                }
                this.boost = undefined;
            }
        }
        else {
            console.log(this + ' sprays bug repellant everywhere!');
            var target = this.place.getClosestBee(0);
            while (target) {
                target.reduceArmor(10);
                target = this.place.getClosestBee(0);
            }
            this.reduceArmor(10);
        }
    };
    return ScubaAnt;
}(Ant));
exports.ScubaAnt = ScubaAnt;
/**
 * Gaurd ant class incapible of acting by itself. Its only purpose is to occupy the same space as another ant and take
 * any damage intended for the target ant will be delt to its gaurd instead.
 * If a gaurd dies, the damage intended for the true target will still be dealt.
 */
var GuardAnt = /** @class */ (function (_super) {
    __extends(GuardAnt, _super);
    function GuardAnt() {
        var _this = _super.call(this, 2, 4) || this;
        _this.name = "Guard";
        return _this;
    }
    GuardAnt.prototype.getGuarded = function () {
        return this.place.getGuardedAnt();
    };
    GuardAnt.prototype.act = function () { };
    return GuardAnt;
}(Ant));
exports.GuardAnt = GuardAnt;
