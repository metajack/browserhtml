/* @flow */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import * as Reflex from "reflex"

const {Effects: FX} = Reflex;

/*:: import * as type from "../../type/common/prelude" */
/*:: import type {Effects} from "reflex/type/effects" */

export const merge = /*::<model:{[key:string]:any}>*/(model/*:model*/, changes/*:{}*/)/*:model*/ => {
  let result = model
  for (let key in changes) {
    if (changes.hasOwnProperty(key)) {
      const value = changes[key]

      if (model[key] !== value) {
        if (result === model) {
          result = {}
          for (let key in model) {
            if (model.hasOwnProperty(key)) {
              result[key] = model[key]
            }
          }
        }

        if (value === void(0)) {
          delete result[key]
        } else {
          result[key] = value
        }
      }
    }
  }

  // @FlowIssue: Ok just trust me on this!
  return result
}


export const take = /*::<item>*/(items/*:Array<item>*/, n/*:number*/)/*:Array<item>*/ =>
  items.length <= n ?
    items :
    items.slice(0, n)

export const move = /*::<item>*/(items/*:Array<item>*/, from/*:number*/, to/*:number*/)/*:Array<item>*/ => {
  const count = items.length
  if (from === to) {
    return items
  } else if (from >= count) {
    return items
  } else if (to >= count) {
    return items
  } else {
    const result = items.slice(0)
    const target = result.splice(from, 1)[0]
    result.splice(to, 0, target)
    return result
  }
}

export const remove = /*::<item>*/(items/*:Array<item>*/, index/*:number*/)/*:Array<item>*/ =>
  ( index < 0
  ? items
  : index >= items.length
  ? items
  : index === 0
  ? items.slice(1)
  : index === items.length - 1
  ? items.slice(0, index)
  : items.slice(0, index).concat(items.slice(index + 1))
  );


export const setIn = /*::<item>*/(items/*:Array<item>*/, index/*:number*/, item/*:item*/)/*:Array<item>*/ => {
  if (items[index] === item) {
    return items
  } else {
    const next = items.slice(0)
    next[index] = item
    return next
  }
};

const Always = {
  toString() {
    return `always(${this.value})`
  }
}

const alwaysSymbol = Symbol.for('always');

// @FlowIssue: Frow is unable to infer
const Null = () => null;
// @FlowIssue: Frow is unable to infer
const Void = () => void(0);

export const always = /*::<a>*/(a/*:a*/)/*:(...args:Array<any>)=>a*/ => {
  const value = a
  if (value === null) {
    return Null
  }
  else if (value === void(0)) {
    return Void
  }
  // @FlowIssue: Frow does not know we can access property on all other types.
  else if (value[alwaysSymbol] != null) {
    return value[alwaysSymbol]
  } else {
    const f = () => value
    f.value = value
    f.toString = Always.toString
    // @FlowIssue: Flow guards against primitives but we don't care if they're dropped.
    value[alwaysSymbol] = f
    return f
  }
}


// @TODO: Optimze batch by avoiding intermidiate states.
// batch performs a reduction over actions building up a [model, fx]
// pair containing all updates. In the process we create a intermidiate
// model instances that are threaded through updates cycles, there for
// we could implement clojure like `transient(model)` / `persistent(model)`
// that would mark `model` as mutable / immutable allowing `merge` to mutate
// in place if `modlel` is "mutable". `batch` here wolud be able to take
// advantage of these to update same model in place.
export const batch = /*:: <model, action>*/
  ( update/*:(m:model, a:action) => [model, Effects<action>]*/
  , model/*:model*/
  , actions/*:Array<action>*/
  )/*:[model, Effects<action>]*/ =>
{
  let effects = [];
  let index = 0;
  const count = actions.length;
  while (index < count) {
    const action = actions[index];
    let [state, fx] = update(model, action);
    model = state;
    effects.push(fx);
    index = index + 1
  }

  return [model, FX.batch(effects)];
}

export const tag = /*::<tag:string, kind>*/
  (tag/*:tag*/)/*:(value:kind) => type.Tagged<tag, kind>*/ =>
  value =>
  ({ type: tag, source: value });

export const tagged = /*::<tag:string, kind>*/
  (tag/*:tag*/, value/*:kind*/)/*:type.Tagged<tag, kind>*/ =>
  ({ type: tag, source: value });
