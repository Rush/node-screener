#!/usr/bin/env node

var screen = require('./screener').screen;
var assert = require('assert');

var object = [{
	"_id": "503cb6d92c32a8cd06006c50",
	"person": {
		"_id": "503cb6d92c32a8cd06006c53",
		"photoUrlId": "/user/503cb6d92c32a8cd06006c53.jpg",
		"user": {
			"description": "This is my user description",
			"name": "Joe Doe",
			"sex": "f",
			"birthdate": "04.07.1980",
			"password": "213897f1b373721231",
			"salt": "12378127892137123"
		}
	},
	"occupancies": [{
		"_id": "503cb6d92c32a8cd06006c58",
		"servicePoint": {
			"_id": "503cb6d92c32a8cd06006c57",
			"address": {
				"street": "Warszawska",
				"building": 56,
				"city": "Poznań",
				"postcode": "60-603",
			},
			"name": "Texi Drivers Limited.",
			"location": [
			16.9015636, 52.3971881]
		},
		"specialty": {
			"opis": "Taxi Driver - they move your butt from place to place",
			"name": "Taxi Driver",
			"_id": "4eed2d88c3dedf0d0300001c"
		}
	}]
}, {
	"_id": "503cb6d92c32a8cd06006c59",
}];

//screen(obj, [false], {_id: 'ObjectId'});
describe('require(\'screener\')', function() {
	describe('.screen', function() {
		it('should copy whole object', function() {

			var res = screen(object, true);
			assert.deepEqual(res, object);
		});
		it('should copy only single field', function() {
			var res = screen(object, [{
				_id: true
			}]);
			assert.deepEqual(res, [{
				_id: "503cb6d92c32a8cd06006c50"
			}, {
				_id: "503cb6d92c32a8cd06006c59"
			}]);
		});

		it('should copy deep down the spec', function() {
			var res = screen(object, [{
				_id: true,
				occupancies: [{
					servicePoint: {
						location: [true]
					}
				}]
			}]);

			console.log(JSON.stringify(res, null, 4));

			assert.deepEqual(res, [{
				"_id": "503cb6d92c32a8cd06006c50",
				"occupancies": [{
					"servicePoint": {
						"location": [
						16.9015636, 52.3971881]
					}
				}]
			}, {
				"_id": "503cb6d92c32a8cd06006c59"
			}]);
		});

		it('should copy using defined screener and other screeners', function() {
			screen.define('address', function(value) {
				return screen(value, {
					street: 'string',
					building: 'number',
					city: 'string',
					postcode: /\d\d-\d\d\d/
				});
			});

			res = screen(object, [{
				person: {
					photoUrlId: /user\/[a-f0-9]{16}\.jpg/,
					user: {
						description: 'string',
						name: 'string',
						sex: /[fm]/,
						birthdate: /\d\d\.\d\d\.\d\d\d\d/,
					}
				},
				occupancies: [{
					servicePoint: {
						address: 'address'
					}
				}],
			}]);
			assert.deepEqual(res, [{
				"person": {
					"user": {
						"description": "This is my user description",
						"name": "Joe Doe",
						"sex": "f",
						"birthdate": "04.07.1980"
					}
				},
				"occupancies": [{
					"servicePoint": {
						"address": {
							"street": "Warszawska",
							"building": 56,
							"city": "Poznań",
							"postcode": "60-603"
						}
					}
				}]
			}, {}]);

		});

		it('should work equally well with locally defined screener', function() {
		  function addressScreener(value) {
		    return screen(value, {
		      street: 'string',
		      building: 'number',
		      city: 'string',
		      postcode: /\d\d-\d\d\d/
		    });
		  };


			res = screen(object, [{
				person: {
					photoUrlId: /user\/[a-f0-9]{16}\.jpg/,
					user: {
						description: 'string',
						name: 'string',
						sex: /[fm]/,
						birthdate: /\d\d\.\d\d\.\d\d\d\d/,
					}
				},
				occupancies: [{
					servicePoint: {
						address: addressScreener
					}
				}],
			}]);

			console.log(JSON.stringify(res, null, 4));

			assert.deepEqual(res, [{
				"person": {
					"user": {
						"description": "This is my user description",
						"name": "Joe Doe",
						"sex": "f",
						"birthdate": "04.07.1980"
					}
				},
				"occupancies": [{
					"servicePoint": {
						"address": {
							"street": "Warszawska",
							"building": 56,
							"city": "Poznań",
							"postcode": "60-603"
						}
					}
				}]
			}, {}]);

		});


		it('should work with screen.or', function() {
			screen.define('ortest', screen.or('number', 'boolean'));

			var orTest = [123123, true, 'dupa', false, 'eat shit'];

			var res = screen(orTest, ['ortest']);

			assert.deepEqual(res, [123123, true, false]);
		});

		it('should work with screen.and', function() {
			screen.define('andtest', screen.and(/\d+/, /9999/));

			var andTest = ["9999", "99999"];

			var res = screen(andTest, ['andtest']);

			assert.deepEqual(res, [9999]);
		});

		it('should work with screen.merge', function() {
			screen.define('andtest', screen.and(/\d+/, /9999/));

			var mergeTest = {address: {street: "Słowackiego", building: 5}};

			var res = screen(mergeTest, {address: screen.merge({street: 'string', building: 'number'})});

			assert.deepEqual(res, {street: "Słowackiego", building: 5});
		});

		it('should work with custom function validator', function() {



		});

	});
});



screen.define('address', function(value) {
	return screen(value, {
		street: 'string',
		building: 'number',
		city: 'string',
		postcode: /\d\d-\d\d\d/
	});
});

res = screen(object, [{
	person: {
		photoUrlId: /user\/[a-f0-9]{16}\.jpg/,
		user: {
			description: 'string',
			name: 'string',
			sex: /[fm]/,
			birthdate: /\d\d\.\d\d\.\d\d\d\d/,
		}
	},
	occupancies: [{
		servicePoint: {
			address: screen.merge('address')
		}
	}],
}]);

//console.log(JSON.stringify(res, null, 4));