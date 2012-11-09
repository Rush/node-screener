node-screener
=============

Screen and whitelists javascript objects with optional and flexible validation/processing of fields. Useful for filtering documents fetched by Mongoose in Node.JS and for any REST API. It can whitelist objects with complex multi-level structure.

Short examples
=============

    var screen = require('screener').screen;
    var object = {
      _id: "503cb6d92c32a8cd06006c53",
      user: { name: "Joe Doe", birthdate: "04.07.1980"},
      location: { lat: 16.5015636, lon: 52.1971881 }
    };

    var result = screen(object, {
      user: {
        name: 'string', // same effect would be if passed /.*/ regexp
        birthdate: /\d\d\.\d\d\.\d\d\d\d/
      }
      location: {lat: 'number', lon: 'number'}
    });

Result will be

    {
      user: { name: "Joe Doe", birthdate: "04.07.1980"},
      location: { lat: 16.5015636, lon: 52.1971881 }
    };

It can also handle arrays, custom screens (validators), modify values and you can OR/AND multiple screens for complex logic. Cool feature is that you can merge sub-object into the parent object, like in the below short example:

    var result = screen(object, {
      user: screen.merge({
        name: 'string', // same effect would be if passed /.*/ regexp
        birthdate: /\d\d\.\d\d\.\d\d\d\d/
      });
      location: screen.merge({lat: 'number', lon: 'number'});
    });

Result will be:

    {
      name: "Joe Doe",
      birthdate: "04.07.1980",
      lat: 16.5015636,
      lon: 52.1971881
    };

You can register custom validators and you can provide any function as a validator.
You can reuse your screens/validator for simple form validation as well!

        // Let's define an email screener once per application
        screen.define('email', /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\
        ".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA
        -Z\-0-9]+\.)+[a-zA-Z]{2,}))/);
        
Now we would validate some custom data with it easily!

        var validatedEmail = screen(req.param('email'), 'email');
        if(!validatedEmail)
            console.log("Email not valid!");


Available screens
=============

Basic screens
-------------

* true - accept any object
* 'number' - accept the number type
* 'boolean' - accept the boolean type
* 'string' - accept the string type
* 'function' - accept the function type
* 'object' - accept the object type if it is not an array, not a regexp and not null
* RegExp - check if a string matches with the given RegExp, RegExp needs to match the WHOLE string

Advanced screens
-------------

* screen.or - accepts any number of screens as its arguments and applies them in sequential order. If any one of them returns a value, the whole screen will return a value. Not that if a particular screen modified the value, it will be passed to the consequent screen.
* screen.and - accepts any number of screens as its arguments and applies them in sequential order. Each of them needs to return a value for the whole screen to succeed. Note that this could be used to chain custom modifier screens. You could pass `screen.and('string', function(val) {return val.toUpperCase()})` and it will both validate and modify the value at the same time.
* screen.merge - not really a screen in itself but you can pass a spec to it and it will merge its screening result to the parent object. See examples.

Custom screens
-------------

Custom screens can be defined using `screen.define(name, function)` or by putting the function as a screen inside the spec.

Long examples
=============

Specification for an object will be called a spec. Given a spec, screen will recursively
walk through the given object picking only fields specified and only if they pass
a given screener. You will find list of available screeners in the next section.

Suppose you have array of javascript objects that you fetched from a Mongo database:

    var object = [
      {
        "person": {
          "_id": "503cb6d92c32a8cd06006c53",
          "photoUrlId": "/user/503cb6d92c32a8cd06006c53.jpg",
          "user": {
            "description": "This is my user description"
            "name": "Joe Doe",
            "sex": "f",
            "birthdate": "04.07.1980",
          }
        },
        "occupancies": [
          {
            "_id": "503cb6d92c32a8cd06006c58",
            "servicePoint": {
              "_id": "503cb6d92c32a8cd06006c57",
              "address": [
                {
                  "street": "Warszawska",
                  "building": "56",
                  "city": "Poznań",
                  "postcode": "60-603",
                }
              ],
              "name": "Texi Drivers Limited.",
              "location": [
                16.9015636,
                52.3971881
              ]
            },
            "specialty": {
              "opis": "Taxi Driver - they move your butt from place to place",
              "name": "Taxi Driver",
              "_id": "4eed2d88c3dedf0d0300001c"
            }
          }
        ]
      }
    ];

Now let's cut some of the private unnecessary stuff with this simple example:

    var screen = require('screener').screen;
    var res = screen(object, [{
      person: {
        photoUrlId: true,
        user: {
          description: true,
          name: true,
          sex: true,
          birthdate: true,
        }
      },
      occupancies: [true],
    }]);

The resulting object looks like this:

    [{
      "person": {
        "photoUrlId": "/user/503cb6d92c32a8cd06006c53.jpg",
        "user": {
          "description": "This is my user description",
          "name": "Joe Doe",
          "sex": "f",
          "birthdate": "04.07.1980"
        }
      },
      "occupancies": [{
    //.. let's not paste the whole content .. but it would be here all, believe me :)
        }
      }]
    }]

The "true" boolean screener simply fetches everything from the object at the given field.
Please note there here we also use an implicit "array" scanner by enclosing the spec in the array brackets([]).

What about validation of fields? How can we assure the content is what we expect to get?
Let's improve our example a little bit:
  
    // here is how you can register your own "screeners"
    // now you can reuse specification of a specific object
    screen.define('address', function(value) {
      return screen(value, {
        street: 'string',
        building: 'number',
        city: 'string',
        postcode: /\d\d-\d\d\d/
      });
    });
  
    function customFunctionValidator(value) {
      // just return undefined if the input is wrong
      // .. or modify te value to upper case should you wish!
      return value;
    }
  
    var res = screen(object, [{
      person: {
        photoUrlId: /user\/[a-f0-9]{16}\.jpg/,
        user: {
          description: customFunctionValidator,
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

In the above example we made use of regexp screeners which approve the content that fully matches the regexp (/a/ will not match "abc"). We have also demonstrated the use of custom validators. Now you hopefully understand the basics of this module. ;)

