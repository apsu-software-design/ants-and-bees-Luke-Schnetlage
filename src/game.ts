import {Insect, Bee, Ant, GrowerAnt, ThrowerAnt, EaterAnt, ScubaAnt, GuardAnt} from './ants';

class Place {
  protected ant:Ant;
  protected guard:GuardAnt;
  protected bees:Bee[] = [];

  constructor(readonly name:string,
              protected readonly water = false,
              private exit?:Place, 
              private entrance?:Place) {}

  getExit():Place { return this.exit; }

  setEntrance(place:Place){ this.entrance = place; }

  isWater():boolean { return this.water; }

  /**
   * Selects an ant to target, allowing a gaurd ant to take the place of the ant it is gaurding.
   * 
   */
  getAnt():Ant { 
    if(this.guard) 
      return this.guard;
    else 
      return this.ant;
  }

  getGuardedAnt():Ant {
    return this.ant;
  }

  getBees():Bee[] { return this.bees; }

  /**
   * Checks for the closest bee
   * @param maxDistance 
   * @param minDistance 
   * @returns closest bee : bee
   */
  getClosestBee(maxDistance:number, minDistance:number = 0):Bee {
		let p:Place = this;
		for(let dist = 0; p!==undefined && dist <= maxDistance; dist++) {
			if(dist >= minDistance && p.bees.length > 0) {
				return p.bees[0];
      }
			p = p.entrance;
		}
		return undefined;
  }

  /**
   * Adds an instance of an ant to a set location.
   * @param ant 
   * @returns 
   */
  addAnt(ant:Ant):boolean {
    if(ant instanceof GuardAnt) {
      if(this.guard === undefined){
        this.guard = ant;
        this.guard.setPlace(this);
        return true;
      }
    }
    else 
      if(this.ant === undefined) {
        this.ant = ant;
        this.ant.setPlace(this);
        return true;
      }
    return false;
  }

  /**
   * Removes a set ant from its location
   */
  removeAnt():Ant {
    if(this.guard !== undefined){
      let guard = this.guard;
      this.guard = undefined;
      return guard;
    }
    else {
      let ant = this.ant;
      this.ant = undefined;
      return ant;
    }
  }

  /**
   * Adds a bee to the list of bees and sets its location
   * @param bee 
   */
  addBee(bee:Bee):void {
    this.bees.push(bee);
    bee.setPlace(this);
  }

  /**
   * Removes a given bee from the list of bees and removes it from its set location.
   * @param bee 
   */
  removeBee(bee:Bee):void {
    var index = this.bees.indexOf(bee);
    if(index >= 0){
      this.bees.splice(index,1);
      bee.setPlace(undefined);
    }
  }

  /**
   * Removes all bees from the list of bees and all locations.
   */
  removeAllBees():void {
    this.bees.forEach((bee) => bee.setPlace(undefined) );
    this.bees = [];
  }

  /**
   * Removes a bee from its location and adds it to the exit.
   * @param bee 
   */
  exitBee(bee:Bee):void {
    this.removeBee(bee);
    this.exit.addBee(bee);  
  }

  /**
   * Removes both bees and ants from their given location.
   * @param insect 
   */
  removeInsect(insect:Insect) {
    if(insect instanceof Ant){
      this.removeAnt();
    }
    else if(insect instanceof Bee){
      this.removeBee(insect);
    }
  }

  /**
   * Removes ants unless they are scuba ants.
   */
  act() {
    if(this.water){
      if(this.guard){
        this.removeAnt();
      }
      if(!(this.ant instanceof ScubaAnt)){
        this.removeAnt();
      }
    }
  }
}


/**
 * Primary "place" where bees exist. Periodically releasing bees from the hive.
 */
class Hive extends Place {
  private waves:{[index:number]:Bee[]} = {}

  constructor(private beeArmor:number, private beeDamage:number){
    super('Hive');
  }

  /**
   * Creates a wave of bees and adds the wave the the larger list of all waves.
   * @param attackTurn 
   * @param numBees 
   * @returns this
   */
  addWave(attackTurn:number, numBees:number):Hive {
    let wave:Bee[] = [];
    for(let i=0; i<numBees; i++) {
      let bee = new Bee(this.beeArmor, this.beeDamage, this);
      this.addBee(bee);
      wave.push(bee);
    }
    this.waves[attackTurn] = wave;
    return this;
  }
  
  /**
   * Removes bees from the current wave and places them into the ant colony, placing them randomly.
   * @param colony 
   * @param currentTurn 
   * @returns this.waves[currentTurn] | []
   */
  invade(colony:AntColony, currentTurn:number): Bee[]{
    if(this.waves[currentTurn] !== undefined) {
      this.waves[currentTurn].forEach((bee) => {
        this.removeBee(bee);
        let entrances:Place[] = colony.getEntrances();
        let randEntrance:number = Math.floor(Math.random()*entrances.length);
        entrances[randEntrance].addBee(bee);
      });
      return this.waves[currentTurn];
    }
    else{
      return [];
    }    
  }
}

/**
 * Primary dwelling for ants and invasion site for bees.
 */
class AntColony {
  private food:number;
  private places:Place[][] = [];
  private beeEntrances:Place[] = [];
  private queenPlace:Place = new Place('Ant Queen');
  private boosts:{[index:string]:number} = {'FlyingLeaf':1,'StickyLeaf':1,'IcyLeaf':1,'BugSpray':0}

  constructor(startingFood:number, numTunnels:number, tunnelLength:number, moatFrequency=0){
    this.food = startingFood;

    let prev:Place;
		for(let tunnel=0; tunnel < numTunnels; tunnel++)//creates and occupies tunnels
		{
			let curr:Place = this.queenPlace; 
      this.places[tunnel] = [];
			for(let step=0; step < tunnelLength; step++)
			{
        let typeName = 'tunnel';
        if(moatFrequency !== 0 && (step+1)%moatFrequency === 0){
          //this makes sure the first tunnel is never a water tunnel
          //after the first tunnel, a water tunnel is added ever X tunnels where X is moat Frequency
          typeName = 'water';
				}
				
				prev = curr;
        let locationId:string = tunnel+','+step;
        curr = new Place(typeName+'['+locationId+']', typeName=='water', prev);
        prev.setEntrance(curr);
				this.places[tunnel][step] = curr;
			}
			this.beeEntrances.push(curr);//adds bees to the current entrance
		}
  }

  getFood():number { return this.food; }

  increaseFood(amount:number):void { this.food += amount; }

  getPlaces():Place[][] { return this.places; }

  getEntrances():Place[] { return this.beeEntrances; }

  getQueenPlace():Place { return this.queenPlace; }

  queenHasBees():boolean { return this.queenPlace.getBees().length > 0; }

  getBoosts():{[index:string]:number} { return this.boosts; }

  /**
   * Adds a boost to the larger list of boosts available
   * @param boost 
   */
  addBoost(boost:string){
    if(this.boosts[boost] === undefined){
      this.boosts[boost] = 0;
    }
    this.boosts[boost] = this.boosts[boost]+1;
    console.log('Found a '+boost+'!');
  }

  /**
   * Adds an ant to a place as long as there is food and space for an ant to be deployed.
   * @param ant 
   * @param place 
   * 
   */
  deployAnt(ant:Ant, place:Place):string {
    if(this.food >= ant.getFoodCost()){
      //if the player has enough food to deploy the type of any passed in, this code runs
      let success = place.addAnt(ant);
      if(success){
        this.food -= ant.getFoodCost(); //the ant is "fed" its food cost
        return undefined;
      }
      return 'tunnel already occupied';
    }
    return 'not enough food';
  }

  /**
   * Removes an ant deom a given place in the hive.
   * @param place 
   */
  removeAnt(place:Place){
    place.removeAnt();
  }

  /**
   * Performs error checking before applying a set boost to a set ant.
   * @param boost 
   * @param place 
   * @returns 
   */
  applyBoost(boost:string, place:Place):string {
    if(this.boosts[boost] === undefined || this.boosts[boost] < 1) {
      return 'no such boost';
    }
    let ant:Ant = place.getAnt();
    if(!ant) {
      return 'no Ant at location' 
    }
    ant.setBoost(boost);
    return undefined;
  }

  /**
   * Every instance of any kind of any performs its act() function respective to its class.
   */
  antsAct() {
    this.getAllAnts().forEach((ant) => {
      //loops for all ants in the game, invoking each ants .act function
      if(ant instanceof GuardAnt) {
        let guarded = ant.getGuarded();
        if(guarded)
          guarded.act(this);
      }
      ant.act(this);
    });    
  }

  /**
   * A loop causing all bees to act.
   */
  beesAct() {
    this.getAllBees().forEach((bee) => {
      bee.act();
    });
  }

  /**
   * loops to perform all act() functions for all instances of a place.
   */
  placesAct() {
    for(let i=0; i<this.places.length; i++) {
      for(let j=0; j<this.places[i].length; j++) {
        this.places[i][j].act();
      }
    }    
  }

  /**
   * Finds and returns an array of all instances of an ant.
   * @returns ants:ant[]
   */
  getAllAnts():Ant[] {
    let ants = [];
    for(let i=0; i<this.places.length; i++) {
      for(let j=0; j<this.places[i].length; j++) {
        if(this.places[i][j].getAnt() !== undefined) {
          ants.push(this.places[i][j].getAnt());
        }
      }
    }
    return ants;
  }

  /**
   * Finds and returns an array of all instances of a bee.
   * @returns bees: bee[]
   */
  getAllBees():Bee[] {
    var bees = [];
    for(var i=0; i<this.places.length; i++){
      for(var j=0; j<this.places[i].length; j++){
        bees = bees.concat(this.places[i][j].getBees());
      }
    }
    return bees;
  }
}

/**
 * Primary game flow control of the game, in charge of iterating turns and deciding if the game is won.
 */
class AntGame {
  private turn:number = 0;
  constructor(private colony:AntColony, private hive:Hive){}

  /**
   * Allows all insects and places to take their respective turns and increments the turn count.
   */
  takeTurn() {
    console.log('');
    this.colony.antsAct();
    this.colony.beesAct();
    this.colony.placesAct();
    this.hive.invade(this.colony, this.turn);
    this.turn++;
    console.log('');
  }

  getTurn() { return this.turn; }

  /**
   * Evaluates if the game as won, if the queen is being attacked by bees, the game is lost.
   * If all bees in both the colony and have are "dead", the game is won.
   * If neither are happening, the game is still ongoing.
   * @returns bool true if the game, false is won or lost | undefined if the game is still ongoing.
   */
  gameIsWon():boolean|undefined {
    if(this.colony.queenHasBees()){
      return false;
    }
    else if(this.colony.getAllBees().length + this.hive.getBees().length === 0) {
      return true;
    }   
    return undefined;
  }

 /**
  * Takes an antType and deploys it do a set location so long as the ant type is valid.
  * @param antType 
  * @param placeCoordinates 
  * @returns 'unknown ant type' | 'illegal location' in the case antType or placeCoordinates are invalid. 
  */
  deployAnt(antType:string, placeCoordinates:string):string {
    let ant;
    switch(antType.toLowerCase()) {
      case "grower":
        ant = new GrowerAnt(); break;
      case "thrower":
        ant = new ThrowerAnt(); break;
      case "eater":
        ant = new EaterAnt(); break;
      case "scuba":
        ant = new ScubaAnt(); break;
      case "guard":
        ant = new GuardAnt(); break;
      default:
        return 'unknown ant type';
    }

    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.deployAnt(ant, place);
    } catch(e) {
      return 'illegal location';
    }
  }

  /**
   * Removes an ant from a set location in the tunnels.
   * @param placeCoordinates 
   * @returns undefined | 'illegal location'
   */
  removeAnt(placeCoordinates:string):string {
    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      place.removeAnt();
      return undefined;
    }catch(e){
      return 'illegal location';
    }    
  }

  /**
   * Trys to apply a set boost to a set ant.
   * @param boostType 
   * @param placeCoordinates 
   * @returns this.colony.applyBoost(boostType,place) | 'illegal location'
   */
  boostAnt(boostType:string, placeCoordinates:string):string {
    try {
      let coords = placeCoordinates.split(',');
      let place:Place = this.colony.getPlaces()[coords[0]][coords[1]];
      return this.colony.applyBoost(boostType,place);
    }catch(e){
      return 'illegal location';
    }    
  }

  getPlaces():Place[][] { return this.colony.getPlaces(); }
  getFood():number { return this.colony.getFood(); }
  getHiveBeesCount():number { return this.hive.getBees().length; }
  /**
   * Finds and returns a lost of all boost names for boosts that a colony has.
   */
  getBoostNames():string[] { 
    let boosts = this.colony.getBoosts();
    return Object.keys(boosts).filter((boost:string) => {
      return boosts[boost] > 0;
    }); 
  }
}

export { AntGame, Place, Hive, AntColony }