#!/usr/bin/env node

var screen = require('./screener').screen;

var obj = [{"_id":"503cb6d92c32a8cd06006c58",
"licenseNr":"2323232",
"nearestFreeAppointment":null,
"servicePoint":{"_id":"503cb6d92c32a8cd06006c57","address":"503cb6d92c32a8cd06006c56","businessEntityType":"osfiz","contactEmail":"maciej.urbaniak.priv@gmail.com","contactPhone":"728926049","name":"Iwomed","shortName":"Iwomed","wwwUrl":"","contactPersonnel":[],"location":[16.9015636,52.3971881],"companyIdNrs":["503aa8732c32a8cd06000841","503aa8732c32a8cd06000842"]},"specialist":"503cb6d92c32a8cd06006c53","specialty":{"opis":"Dermatologia","name":"Dermatolog","_id":"4eed2d88c3dedf0d0300001c"}}];


console.log(screen(obj, [false], {_id: 'ObjectId'}));

