
var screens = {
	'ObjectId': /[0-9a-fA-F]{24}/
};


function specType(spec) {
	if(typeof spec === 'object') {
		if(Array.isArray(spec))
			return 'array';
		if(spec instanceof RegExp)
			return "regexp";
		return 'object';
	}
	else
		return typeof spec;
}


function screen(object, spec, globalSpec) {
	var result, prop, propResult;

	var specT = specType(spec);
	if(specT === 'array') {
		if(!Array.isArray(object))
			return undefined;

		result = [];
		spec = spec[0];
		for(var i = 0;i < object.length;++i) {
			var res = screen(object[i], spec, globalSpec);

			if(typeof res !== 'undefined') {
				result.push(res);
			}
		}
		return result;
	}
	else if(specT === 'string') {
		return screen(object, screens[spec], globalSpec);
	}
	else if(specT === 'function') {
		return spec(object);
	}
	// true means whitelist whole object
	else if(specT === 'boolean' && spec === true) {
		return object;
	}
	// false means process to only use global white list - recursively
	else if(specT === 'boolean' && spec === false && specType(object) === 'object') {
		for(prop in object) {

			if(specType(object[prop]) === 'object') {
				propResult = screen(object[prop], false, globalSpec);
				if(typeof propResult !== 'undefined') {
					if(!result)
						result = {};
					result[prop] = propResult;
				}
			}
			if(typeof globalSpec[prop] !== 'undefined') {
				if(object[prop] !== 'undefined') {
					propResult = screen(object[prop], globalSpec[prop], globalSpec);
					if(typeof propResult !== 'undefined') {
						if(!result)
							result = {};
						result[prop] = propResult;
					}
				}
			}
		}
		return result;
	}
	else if(specT === 'regexp' && typeof object === 'string') {
		var reMatch = object.match(spec);
		if(reMatch && reMatch[0].length == object.length)
			return object;
	}
	else if(specT === 'object') {
		result = {};
		// check for existance of properties in the global spec (which can whitelist fields in any object)

		if(typeof globalSpec === 'object') {
			for(prop in object) {
				if(typeof globalSpec[prop] === 'undefined')
					continue;
				propResult = screen(object[prop], globalSpec[prop], globalSpec);
				if(typeof propResult !== 'undefined') {
					result[prop] = propResult;
				}			
			}
		}
		for(prop in spec) {
			if(typeof object[prop] === 'undefined')
				continue;
			propResult = screen(object[prop], spec[prop], globalSpec);
			if(typeof propResult !== 'undefined') {
				result[prop] = propResult;
			}

		}
		return result;
	}
}

exports.screen = screen;