'use strict';

module.exports = class Base {

  constructor(){
    this.model = true;
    this.q = {};
    return this;
  }

  getBlankRow(d){
    var blank = {};
    var columns = Object.keys(this.constructor.properties.columns);
    for (var i = 0; i < columns.length; i++) {
      blank[columns[i]] = d || null;
    }
    return blank;
  }

  /**
    @example
      // select some columns
      new UserModel().select({name: true})
    @example
      // select all columns
      new UserModel().select()
  */
  select(ob){
    if(this.q.method) throw 'Method already set to ' + this.q.method;
    this.q.method = 'select';
    this.q.columns = ob || this.getBlankRow(true); 
    return this;
  }

  form(){ 
    this.q.form = true;
    return this;
  }

  aggAlias(a){
    this.q.aggAlias = a;
    return this;
  }

  aggArray(a){
    this.q.aggArray = a;
    return this;
  }

  agg(asn){
    if(!asn) throw 'must have alias';
    // this.as(asn);
    this.aggAlias(asn);
    this.q.aggregate = true;
    return this;
  }

  aggOne(asn){
    if(!asn) throw 'must have an alias';
    // this.as(asn);
    this.aggAlias(asn);
    this.q.aggregateOne = true;
    return this;
  }

  as(asn){
    this.q.as = asn;
    return this;
  }

  /**
    @example
      // with object
      new UserModel().insert({name: 'name1'})
    @example
      // with array
      new UserModel().insert([{name: 'name1', email: 'email'}, {name: 'name2', phone: 'phone'}])
  */
  insert(arr){
    if(this.q.method) throw 'Method already set to ' + this.q.method;
    this.q.method = 'insert';
    if(!Array.isArray(arr)) arr = [arr];
    this.q.columns = arr;
    return this;
  }

  delete(){
    if(this.q.method) throw 'Method already set to ' + this.q.method;
    this.q.method = 'delete';
    return this;
  }

  // {on: ['colname'], update: {col: val}}
  conflict(ob){
    if(typeof ob.on == 'string') ob.on = [ob.on];
    this.q.conflict = ob;
    return this;
  }

  returning(ob){
    ob = ob || {['*']: true};
    this.q.returning = ob || {['*']: true};
    return this;
  }

  /**
    @example new UserModel().update({name: 'newname'})
  */
  update(ob){
    if(this.q.method) throw 'Method already set to ' + this.q.method;
    this.q.method = 'update';
    this.q.columns = ob || {['*']: true};
    return this;
  }

  /**
    @example where({name: 'something', user_count: {$gt: 2, $lt: 10}})
  */
  where(whereob){
    this.q.where = whereob;
    return this;
  }

  /**
    @example group({uid: true})
  */
  group(g){
    if(this.q.method !== 'select') throw 'Cannot group when method set to ' + this.q.method;
    this.q.groupby = g;
    return this;
  }

  /**
    @example order({by: {kela: true}, type: 'asc'})
  */
  order(o){
    if(this.q.method !== 'select') throw 'Cannot order when method set to ' + this.q.method;
    this.q.orderby = o;
    return this;
  }

  /**
    @example limit(10)
  */
  limit(num){
    if(this.q.method !== 'select') throw 'Cannot limit when method set to ' + this.q.method;
    this.q.limit = num;
    return this;
  }

  /**
    @example skip(10)
  */
  skip(num){
    if(this.q.method !== 'select') throw 'Cannot skip when method set to ' + this.q.method;
    this.q.offset = num;
    return this;
  }

  /**
    @example join({on: {name: SomeModel.name}, model: SomeModel.select()});
  */
  join(params){
    return this.innerJoin(params);
  }

  /**
    @example innerJoin({on: {name: SomeModel.name}, model: SomeModel.select()});
  */
  innerJoin(params){
    this.buildJoin('INNER', params.model, params.on, params.as);
    return this;
  }

  /**
    @example leftOuterJoin({on: {name: SomeModel.name}, model: SomeModel.select()});
  */
  leftOuterJoin(params){
    this.buildJoin('LEFT OUTER', params.model, params.on, params.as);
    return this;
  }

  /**
    @example rightOuterJoin({on: {name: SomeModel.name}, model: SomeModel.select()});
  */
  rightOuterJoin(params){
    this.buildJoin('RIGHT OUTER', params.model, params.on, params.as);
    return this;
  }

  /**
    @private
  */
  buildJoin(type, model, params, as){
    if(!model) throw 'Cannot join without model';
    if(!params) throw 'Cannot join without ON condition';
    if(this.q.method !== 'select') throw 'Cannot join when method set to ' + this.q.method;
    if(!this.q.joins) this.q.joins = [];
    this.q.joins.push({
      type: type,
      model: model,
      on: params,
      as: as
    });
  }
  
  /**
    @summary all actions on model insert go here.
  */
  static postInsert(model){}

  /**
    @summary all actions on model update go here.
  */
  static postUpdate(model){}

  /**
    @summary: it is MANDATORY to call this function
    @param @required session.user
    @param @required session.client
  */

  authenticate(session){
    this.authenticated = true;
    this.session = session;
    return this;
  }

};
