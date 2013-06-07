 ({
 	define: typeof define === "function" ? define : function(A, F) {
 		module.exports = F.apply(null, A.map(require));
 	}
 }).
 define([], function() {

 	var screens = {
 		ObjectId: /[0-9a-fA-F]{24}/,
 		'string': function(value) {
 			if (typeof value === 'string') return value;
 		},
 		'number': function(value) {
 			if (typeof value === 'number') return value;
 		},
 		'boolean': function(value) {
 			if (typeof value === 'boolean') return value;
 		},
 		'function': function(value) {
 			if (typeof value === 'function') return value;
 		},
 		'object': function(value) {
			if (typeof value === 'object') return value;
 		}
 	};

 	function MergeObject(object) {
 		this.object = object;
 	}

 	function mapTypeToScreen(type) {
 		if(type === Boolean) return 'boolean';
		if(type === Number) return 'number';
		if(type === String) return 'number';
 	}


 	function specType(spec) {
 		if (typeof spec === 'object') {
 			if (Array.isArray(spec)) return 'array';
 			if (spec instanceof RegExp) return "regexp";
 			if (spec === null) return "null";
 			return 'object';
 		} else return typeof spec;
 	}

 	function screen(object, spec, _options) {
 		var result, prop, propResult;
 		var options = _options || {};
 		var globalSpec = options.globalSpec;

 		var specT = specType(spec);
 		if (specT === 'array') {
 			if (!Array.isArray(object)) {

 				if (options.exact) throw new Error("Field is not array");

 				if (options.fill) return [];
 				return undefined;
 			}

 			result = [];
 			spec = spec[0];
 			for (var i = 0; i < object.length; ++i) {
 				var res = screen(object[i], spec, options);

 				if (typeof res !== 'undefined') {
 					result.push(res);
 				}
 				else if(options.exact) {
 					throw new Error("Element " + i + " in array field has wrong type");
 				}
 			}
 			return result;
 		} else if (specT === 'string') {
 			return screen(object, screens[spec], options);
 		} else if (specT === 'function') {
 			return spec(object);
 		}
 		// true means whitelist whole object
 		else if (specT === 'boolean' && spec === true) {
 			return object;
 		}
 		// false means process to only use global white list - recursively
 		// TODO: rethink this feature!
 		else if (specT === 'boolean' && spec === false && specType(object) === 'object') {
 			for (prop in object) {

 				if (specType(object[prop]) === 'object') {
 					propResult = screen(object[prop], false, options);
 					if (typeof propResult !== 'undefined') {
 						if (!result) result = {};
 						result[prop] = propResult;
 					} else if (options.fill) {
 						result[prop] = null;
 					}
 				}
 				if (typeof globalSpec[prop] !== 'undefined') {
 					if (object[prop] !== 'undefined') {
 						propResult = screen(object[prop], globalSpec[prop], options);
 						if (typeof propResult !== 'undefined') {
 							if (!result) result = {};
 							result[prop] = propResult;
 						}
 					}
 				}
 			}
 			return result;
 		} else if (specT === 'regexp' && typeof object === 'string') {
 			var reMatch = object.match(spec);
 			if (reMatch && reMatch[0].length == object.length) return object;
 		} else if (specT === 'object') {
 			result = {};
 			// check for existance of properties in the global spec (which can whitelist fields in any object)
 			if (typeof globalSpec === 'object') {
 				for (prop in object) {
 					if (typeof globalSpec[prop] === 'undefined') continue;
 					propResult = screen(object[prop], globalSpec[prop], options);

 					if (typeof propResult !== 'undefined') {
 						result[prop] = propResult;
 					}
 				}
 			}
			if(!object) {
				if(options.fill)
					object = {};
				else if(options.exact)
					throw new Error("Missing object: " + prop);
				else
					return undefined;
			}
 			for (prop in spec) {
 				if (typeof object[prop] === 'undefined') {
 					if (options.exact) throw new Error("Missing field: " + prop);
 					if (options.fill) {
				  	if(specType(spec[prop]) === 'array')
              result[prop] = [];
            else
							result[prop] = null;
					}
 					continue;
 				}
 				propResult = screen(object[prop], spec[prop], options);

 				// in case of using screen.merge, get the result's properties
 				// and copy to the current result
 				if (propResult instanceof MergeObject) {
 					for (var propMerge in propResult.object) {
 						result[propMerge] = propResult.object[propMerge];
 					}
 				}
 				// otherwise copy the result normally
 				else if (typeof propResult !== 'undefined') {
 					result[prop] = propResult;
 				}
 				// throw error when missing field
 				else if(options.exact) {
 					throw new Error("Screen failed for: " + prop);
 				}
 				// or fill with null if requested
 				else if (options.fill) {
 					result[prop] = null;
 				}

 			}
 			return result;
 		}
 	}

 	screen.api = function(object, spec, _options) {
 		var options = {} || _options;
 		options.fill = true;
 		return screen(object, spec, options);
 	};

 	screen.exact = function(object, spec, _options) {
 		var options = {} || _options;
 		options.exact = true;
 		try {
 			return screen(object, spec, options);
 		} catch(e) {
 			return undefined;
 		}
 	}

 	screen.define = function(name, screenFunction) {
 		screens[name] = screenFunction;
 	};

 	screen.or = function() {
 		var screens = arguments;
 		return function(value) {
 			var i, res;
 			var input = value,
 				output;
 			for (i = 0; i < screens.length; ++i) {
 				res = screen(input, screens[i]);
 				if (typeof res !== 'undefined') {
 					input = res;
 					output = res;
 				}
 			}
 			return output;
 		};
 	};

 	// TODO: AND should respect options
 	screen.and = function() {
 		var screens = arguments;
 		return function(value) {
 			var i;
 			var res = value;
 			for (i = 0; i < screens.length; ++i) {
 				res = screen(res, screens[i]);
 				if (typeof res === 'undefined') return undefined;
 			}
 			return res;
 		};
 	};

 	screen.merge = function(spec, options) {
 		return function(value) {
 			var res = screen(value, spec, options);
 			if (typeof res !== 'undefined') return new MergeObject(res);
 		};
 	};
 	screen.screen = screen; // backwards API compatibility

 	return screen;
 });