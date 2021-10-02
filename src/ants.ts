import {AntColony, Place} from './game';


/**
 * The abstract Insect class that bee and ant extend from.
 * 
 * 
 */
export abstract class Insect {
  readonly name:string;

  constructor(protected armor:number, protected place:Place){}

  getName():string { return this.name; }
  getArmor():number { return this.armor; }
  getPlace() { return this.place; }
  setPlace(place:Place){ this.place = place; }

  /**
   * Removes armor from an insect, "killing" them in the run out of armor. Returns true if the insect dies, otherwise false.
   * @param amount:number
   * @returns boolean
   */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    if(this.armor <= 0){
      //a simple operation to remove insects with no armor and are therefore "dead"
      console.log(this.toString()+' ran out of armor and expired');
      this.place.removeInsect(this);
      return true;
    }
    return false;
  }

  abstract act(colony?:AntColony):void;

  toString():string {
    return this.name + '('+(this.place ? this.place.name : '')+')';
  }
}


/**
 * Bee class capible of stinging ants and acting.
 * 
 */
export class Bee extends Insect {
  readonly name:string = 'Bee';
  private status:string;

  constructor(armor:number, private damage:number, place?:Place){
    super(armor, place);
  }

  /**
   * Sting Function, the bee stings an ant and deals damage to the ants armor, killing it if damage is greater than armor.
   * @param ant:Ant
   * @returns boolean
   */
  sting(ant:Ant):boolean{
    console.log(this+ ' stings '+ant+'!');
    return ant.reduceArmor(this.damage);
  }

  isBlocked():boolean {
    return this.place.getAnt() !== undefined;
  }

  setStatus(status:string) { this.status = status; }

  /**
   * Primary action selection for a given bee. If a bee is blocked, it will sting its blocker, if it is not blocked, it exit its location.
   * A bee that exits the colony will enter the queens domain and attack her, making the player lose the game.
   * Both of these actions are influenced by statuses influcted by boosts. 
   * Cold bees are unable to string and stuck bees are unable to exit.
   * 
   */
  act() {
    if(this.isBlocked()){
      if(this.status !== 'cold') {
        this.sting(this.place.getAnt());
      }
    }
    else if(this.armor > 0) {
      if(this.status !== 'stuck'){
        this.place.exitBee(this);
      }
    }    
    this.status = undefined;
  }
}

/**
 * The base abstract ant class all other ants extend from.
 */
export abstract class Ant extends Insect {
  protected boost:string;
  constructor(armor:number, private foodCost:number = 0, place?:Place) {
    super(armor, place);
  }

  
  getFoodCost():number { return this.foodCost; }
  setBoost(boost:string) { 
    this.boost = boost; 
      console.log(this.toString()+' is given a '+boost);
  }
}

/**
 * Grower ant capable of growing food and occasionally finding boosts.
 */
export class GrowerAnt extends Ant {
  readonly name:string = "Grower";
  constructor() {
    super(1,1)
  }

  /**
   * Random table to determine what a given ant "grows" in a turn. The most likely result being food, followed by the leaf based boosts,
   * finally followed by the rarest boost, bugspray.
   * @param colony 
   */
  act(colony:AntColony) {
    let roll = Math.random();
    if(roll < 0.6){
      colony.increaseFood(1);
    } else if(roll < 0.7) {
      colony.addBoost('FlyingLeaf');
    } else if(roll < 0.8) {
      colony.addBoost('StickyLeaf');
    } else if(roll < 0.9) {
      colony.addBoost('IcyLeaf');
    } else if(roll < 0.95) {
      colony.addBoost('BugSpray');
    }
  }  
}

/**
 * Thrower ant class capable of throwing "normal" leaves to deal damage to bees or boosts for a special effect.
 * 
 */
export class ThrowerAnt extends Ant {
  readonly name:string = "Thrower";
  private damage:number = 1;

  constructor() {
    super(1,4);
  }

  /**
   * Primary decision tree for thrower ants. If using a standard or flying leaf, deals damage to the closest bee to a given ant.
   * If given a sticky leaf or icy leaf, inflicts status effect to the closest bee.
   * If bugspray is given to an ant, it will spray the entire tunnel, dealing 10 damage to all insects in its tunnel, including itself.
   */
  act() {
    if(this.boost !== 'BugSpray'){
      //so long as the ant isn't given bugspray, it will look for the closest ant within a range, then throw its leaf.
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);

      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
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
      let target = this.place.getClosestBee(0);
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * Eater ant class capible of eating bees, one at a time, over the course of several turns. Should an eater ant die with a bee still
 * in its stomach, it will cough up the bee. The bee will go back to its normal behavior.
 */
export class EaterAnt extends Ant {
  readonly name:string = "Eater";
  private turnsEating:number = 0;
  private stomach:Place = new Place('stomach');
  constructor() {
    super(2,4)
  }

  isFull():boolean {
    return this.stomach.getBees().length > 0;
  }

  /**
   * Primary decision tree for eater ants.
   * If the ant is not difesting a bee, it will look for a bee to eat. If it is already eating a bee, it will increment each turn
   * until the bee is fully eaten or the ant dies. If the ant dies, it will cough up the bee it was eating.
   */
  act() {
    console.log("eating: "+this.turnsEating);
    if(this.turnsEating == 0){
      console.log("try to eat");
      let target = this.place.getClosestBee(0);
      if(target) {
        console.log(this + ' eats '+target+'!');
        this.place.removeBee(target);
        this.stomach.addBee(target);
        this.turnsEating = 1;
      }
    } else {
      if(this.turnsEating > 3){
        this.stomach.removeBee(this.stomach.getBees()[0]);
        this.turnsEating = 0;
      } 
      else 
        this.turnsEating++;
    }
  }  

  /**
   * A function to deal damage to an eater ant and trigger any appropriate side effects should the ant die.
   * If the eater ant dies before fully digesting the bee it is eating, it will "cough up" the bee, allowing it to continue fighting. 
   * @param amount : number
   * @returns boolen
   */
  reduceArmor(amount:number):boolean {
    this.armor -= amount;
    console.log('armor reduced to: '+this.armor);
    if(this.armor > 0){
      //If an eater ant does not die, but does take damage, this code will execute.
      if(this.turnsEating == 1){
        //should an eater ant take damage the turn after it eats a bee, it will cough it back up
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
        this.turnsEating = 3;
      }
    }
    else if(this.armor <= 0){
      //if an eater ant dies, this code will execute
      if(this.turnsEating > 0 && this.turnsEating <= 2){
        //if an eater ant dies and the bee was not fully digested in 3 turns, it will be coughed up.
        let eaten = this.stomach.getBees()[0];
        this.stomach.removeBee(eaten);
        this.place.addBee(eaten);
        console.log(this + ' coughs up '+eaten+'!');
      }
      return super.reduceArmor(amount);
    }
    return false;
  }
}

/**
 * Scuba ant class, capible of all actions the thrower ant is. The meaningful difference between the scuba and thrower ant is their interaction with water.
 * Thrower ants are unable to function in water flooded tunnels while scuba ants are unaffected by water.
 */
export class ScubaAnt extends Ant {
  readonly name:string = "Scuba";
  private damage:number = 1;

  constructor() {
    super(1,5)
  }

  /**
   * Primary decision tree for scuba ants. If using a standard or flying leaf, deals damage to the closest bee to a given ant.
   * If given a sticky leaf or icy leaf, inflicts status effect to the closest bee.
   * If bugspray is given to an ant, it will spray the entire tunnel, dealing 10 damage to all insects in its tunnel, including itself.
   */
  act() {
    if(this.boost !== 'BugSpray'){
      let target;
      if(this.boost === 'FlyingLeaf')
        target = this.place.getClosestBee(5);
      else
        target = this.place.getClosestBee(3);

      if(target){
        console.log(this + ' throws a leaf at '+target);
        target.reduceArmor(this.damage);
    
        if(this.boost === 'StickyLeaf'){
          target.setStatus('stuck');
          console.log(target + ' is stuck!');
        }
        if(this.boost === 'IcyLeaf') {
          target.setStatus('cold');
          console.log(target + ' is cold!');
        }
        this.boost = undefined;
      }
    }
    else {
      console.log(this + ' sprays bug repellant everywhere!');
      let target = this.place.getClosestBee(0);
      while(target){
        target.reduceArmor(10);
        target = this.place.getClosestBee(0);
      }
      this.reduceArmor(10);
    }
  }
}

/**
 * Gaurd ant class incapible of acting by itself. Its only purpose is to occupy the same space as another ant and take
 * any damage intended for the target ant will be delt to its gaurd instead.
 * If a gaurd dies, the damage intended for the true target will still be dealt.
 */
export class GuardAnt extends Ant {
  readonly name:string = "Guard";

  constructor() {
    super(2,4)
  }

  getGuarded():Ant {
    return this.place.getGuardedAnt();
  }

  act() {}
}
