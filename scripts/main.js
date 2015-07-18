angular
        .module('adoptionApp', [
          'ngRoute',
          'selectbox',
          'angular-momentum-scroll'
        ])

        .config(function ($routeProvider) {
          $routeProvider
            .when('/', {
              templateUrl: 'partials/search.html',
              controller: 'SearchCtrl'
            })
            .when('/search', {
              templateUrl: 'partials/search.html',
              controller: 'SearchCtrl'
            })
            .when('/search/:type', {
              templateUrl: 'partials/search.html',
              controller: 'SearchCtrl'
            })
            .when('/results', {
              templateUrl: 'partials/results.html',
              controller: 'ResultsCtrl'
            })
            .when('/results/:id', {
              templateUrl: 'partials/details.html',
              controller: 'DetailsCtrl'
            })
            .otherwise({
              // redirectTo: '/'
            });
        })

        .directive('compile', ['$compile', function ($compile) {
          return function(scope, element, attrs) {
              scope.$watch(
                  function(scope) {
                      return scope.$eval(attrs.compile);
                  },
                  function(value) {
                      element.html(value);
                      $compile(element.contents())(scope);
                  }
              );
          };
        }])

        .service('QueryParams', ['$window', function($window) {
          var searchParams = $window.location.search.replace(/[\?\/]/g, '').split('&');
          var result = {};

          angular.forEach(searchParams, function(param, index) {
            var splitValues = param.split('=');
            if (splitValues.length === 2 && splitValues[1].length > 0) {
              var paramName = splitValues[0];
              var paramValue = decodeURIComponent(splitValues[1]);
              result[paramName] = paramValue;
            }
          });

          return function(name) {
            if (name) {
              return result[name];
            }

            return result
          };

        }])

        .service('PetListService', ['$http', '$q', function($http, $q) {
          var urlTemplate = 'https://api.adoptapet.com/search/pet_search?key=14a00a8f876f8227692a72fa5102e149&geo_range=50&v=2&output=json';

          return function(searchData) {
            var deferred = $q.defer();
            var url = urlTemplate;
            var apiFields = {
              city_or_zip: 'city_or_zip',
              species: 'species',
              breed: 'breed_id',
              gender: 'sex',
              age: 'age',
              size: 'pet_size_range_id',
              hair: 'hair'
            }

            angular.forEach(searchData, function(value, key) {
              if (apiFields[key]) {
                url += '&' + apiFields[key] + '=' + value;
              }
            });

            var noPetsFoundMessage = 'We don\'t seem to have any pets that fit your criteria. Please broaden your search and try again';
            var requestFailedMessage = 'Sorry, your search could not be completed. Please try again.';

            $http({ cache: true, url: url, method: 'GET'})
              .then(function(result) {

                if (result.data) {
                  if (result.data.pets) {
                    deferred.resolve(result.data.pets);
                  } else if (result.data.exception && result.data.exception.msg === 'no_pets_found') {
                    deferred.reject({message: noPetsFoundMessage});
                  } else {
                    deferred.reject({message: requestFailedMessage});
                  }
                } else {
                  deferred.reject({message: requestFailedMessage});
                }
              }, function(error) {
                deferred.reject({message: requestFailedMessage});
              });

            return deferred.promise;
          };

        }])

        .service('PetService', ['$http', '$q', function($http, $q) {
          var urlTemplate = 'https://api.adoptapet.com/search/pet_details?pet_id={petId}&key=14a00a8f876f8227692a72fa5102e149&v=2&output=json';

          return function(petId) {
            var deferred = $q.defer();
            var url = urlTemplate.replace('{petId}', petId);

            function petContactNumber(pet) {
              var contactNumber = '';

              if (pet.phone_area_code && pet.phone_area_code.length) {
                contactNumber = '1 (' + pet.phone_area_code + ') ';
              }

              if (pet.phone_number && pet.phone_number.length) {
                contactNumber += pet.phone_number;
              }

              if (pet.phone_extension && pet.phone_extension.length) {
                contactNumber += ' ext. ' + pet.phone_extension;
              }

              return contactNumber;
            }

            var requestFailedMessage = 'Sorry, your search could not be completed. Please try again.';
            $http({ cache: true, url: url, method: 'GET'})
              .then(function(result) {
                if (result.data) {
                  if (result.data.pet) {
                    var pet = result.data.pet;
                    var newpet = {};

                    newpet.name = (pet.pet_name || '');
                    newpet.age = (pet.age || '');
                    newpet.gender = (pet.sex || '');
                    newpet.breed = (pet.primary_breed || '');
                    newpet.phone = petContactNumber(pet);
                    newpet.addr_line_1 = (pet.addr_line_1 || '');
                    newpet.addr_line_2 = (pet.addr_line_2 || '');
                    newpet.addr_city = (pet.addr_city || '');
                    newpet.addr_state_code = (pet.addr_state_code || '');
                    newpet.addr_postal_code = (pet.addr_postal_code || '');
                    newpet.images = (pet.images || []);

                    // strip html from description
                    newpet.description = (pet.description) ? pet.description.replace(/<\/?[^>]+(>|$)/g, '') : '';

                    deferred.resolve(newpet);
                  } else if (result.data.error) {
                    var error = result.data.error;
                    error.message = (error.details) ? error.details : error.msg;
                    deferred.reject(error);
                  } else {
                    deferred.reject({message: requestFailedMessage});
                  }
                } else {
                  deferred.reject({message: requestFailedMessage});
                }
              }, function(error) {
                deferred.reject({message: requestFailedMessage});
              });

             return deferred.promise;
           };

         }])

        .factory('AdoptionCache', ['$cacheFactory', function($cacheFactory) {
          return $cacheFactory('adoption-cache');
        }])

        .factory('PetFormFields', [function() {
          return function(species, fields) {
            // Cat Data
            var catBreedOptions = [{"id":1,"name":"Any","value":""},{"id":2,"name":"Abyssinian","value":"real=967"},{"id":3,"name":"American Bobtail","value":"real=1119"},{"id":4,"name":"American Curl","value":"real=1120"},{"id":5,"name":"American Shorthair","value":"real=968"},{"id":6,"name":"American Wirehair","value":"real=1122"},{"id":7,"name":"Balinese","value":"real=969"},{"id":8,"name":"Bengal","value":"real=970"},{"id":9,"name":"Birman","value":"real=971"},{"id":10,"name":"Bombay","value":"real=972"},{"id":11,"name":"British Shorthair","value":"real=973"},{"id":12,"name":"Burmese","value":"real=974"},{"id":13,"name":"Calico","value":"criteria=1198"},{"id":14,"name":"Chartreux","value":"real=1123"},{"id":15,"name":"Colorpoint Shorthair","value":"real=1124"},{"id":16,"name":"Cornish Rex","value":"real=1125"},{"id":17,"name":"Cymric","value":"real=1139"},{"id":18,"name":"Devon Rex","value":"real=1126"},{"id":19,"name":"Domestic Longhair","value":"real=1127"},{"id":20,"name":"Domestic Mediumhair","value":"real=1128"},{"id":21,"name":"Domestic Shorthair","value":"real=1129"},{"id":22,"name":"Egyptian Mau","value":"real=1130"},{"id":23,"name":"European Burmese","value":"real=1131"},{"id":24,"name":"Exotic","value":"real=1132"},{"id":25,"name":"Havana Brown","value":"real=1133"},{"id":26,"name":"Hemingway/Polydactyl","value":"real=1192"},{"id":27,"name":"Himalayan","value":"real=976"},{"id":28,"name":"Japanese Bobtail","value":"real=1134"},{"id":29,"name":"Javanese","value":"real=1135"},{"id":30,"name":"Korat","value":"real=1136"},{"id":31,"name":"LaPerm","value":"real=1137"},{"id":32,"name":"Maine coon","value":"real=977"},{"id":33,"name":"Manx","value":"real=1138"},{"id":34,"name":"Munchkin","value":"real=1191"},{"id":35,"name":"Norwegian Forest Cat","value":"real=979"},{"id":36,"name":"Ocicat","value":"real=980"},{"id":37,"name":"Oriental","value":"real=1140"},{"id":38,"name":"Persian","value":"real=981"},{"id":39,"name":"Polydactyl/Hemingway","value":"real=1192"},{"id":40,"name":"RagaMuffin","value":"real=1141"},{"id":41,"name":"Ragdoll","value":"real=982"},{"id":42,"name":"Russian Blue","value":"real=983"},{"id":43,"name":"Scottish Fold","value":"real=1142"},{"id":44,"name":"Selkirk Rex","value":"real=1143"},{"id":45,"name":"Siamese","value":"real=984"},{"id":46,"name":"Siberian","value":"real=1151"},{"id":47,"name":"Singapura","value":"real=1145"},{"id":48,"name":"Snowshoe","value":"real=985"},{"id":49,"name":"Somali","value":"real=1146"},{"id":50,"name":"Sphynx","value":"real=1147"},{"id":51,"name":"Tonkinese","value":"real=1148"},{"id":52,"name":"Turkish Angora","value":"real=1149"},{"id":53,"name":"Turkish Van","value":"real=986"}];
            var catAgeOptions = [
              {name:'Any', value:''},
              {name:'Kitten', value: 'kitten'},
              {name:'Young', value: 'young'},
              {name:'Adult', value: 'adult'},
              {name:'Senior', value: 'senior'}];
            var catHairField = {
              displayName: 'Hair',
              name: 'hair',
              options: [
                {name: 'Any', value: ''},
                {name: 'Short', value: 'short'},
                {name: 'Medium', value: 'medium'},
                {name: 'Long', value: 'long'}
              ]
            };

            // Dog Data
            var dogBreedOptions = [{"id":1,"name":"Any","value":""},{"id":2,"name":"Affenpinscher","value":"real=187"},{"id":3,"name":"Afghan Hound","value":"real=1"},{"id":4,"name":"Airedale Terrier","value":"real=2"},{"id":5,"name":"Akbash","value":"real=800"},{"id":6,"name":"Akita","value":"real=3"},{"id":7,"name":"Alaskan Malamute","value":"real=4"},{"id":8,"name":"American Bulldog","value":"real=361"},{"id":9,"name":"American Eskimo Dog","value":"real=5"},{"id":10,"name":"American Hairless Terrier","value":"real=1167"},{"id":11,"name":"American Pit Bull Terrier","value":"real=801"},{"id":12,"name":"American Staffordshire Terrier","value":"real=1082"},{"id":13,"name":"American Water Spaniel","value":"nick=1030"},{"id":14,"name":"Anatolian Shepherd","value":"real=7"},{"id":15,"name":"Australian Cattle Dog","value":"real=8"},{"id":16,"name":"Australian Kelpie","value":"real=9"},{"id":17,"name":"Australian Shepherd","value":"real=10"},{"id":18,"name":"Australian Terrier","value":"real=802"},{"id":19,"name":"Basenji","value":"real=12"},{"id":20,"name":"Basset Griffon Vendeen","value":"nick=1053"},{"id":21,"name":"Basset Hound","value":"real=13"},{"id":22,"name":"Beagle","value":"real=14"},{"id":23,"name":"Bearded Collie","value":"real=15"},{"id":24,"name":"Beauceron","value":"real=803"},{"id":25,"name":"Bedlington Terrier","value":"real=189"},{"id":26,"name":"Belgian Laekenois","value":"real=1168"},{"id":27,"name":"Belgian Malinois","value":"real=191"},{"id":28,"name":"Belgian Shepherd","value":"real=16"},{"id":29,"name":"Belgian Tervuren","value":"real=192"},{"id":30,"name":"Bernese Mountain Dog","value":"real=17"},{"id":31,"name":"Bichon Frise","value":"real=18"},{"id":32,"name":"Black Mouth Cur","value":"real=804"},{"id":33,"name":"Black and Tan Coonhound","value":"real=19"},{"id":34,"name":"Bloodhound","value":"real=20"},{"id":35,"name":"Blue Heeler","value":"nick=1027"},{"id":36,"name":"Blue Lacy/Texas Lacy","value":"real=1368"},{"id":37,"name":"Bluetick Coonhound","value":"real=193"},{"id":38,"name":"Bobtail","value":"nick=1041"},{"id":39,"name":"Bolognese","value":"real=1165"},{"id":40,"name":"Border Collie","value":"real=21"},{"id":41,"name":"Border Terrier","value":"real=194"},{"id":42,"name":"Borzoi","value":"real=22"},{"id":43,"name":"Boston Terrier","value":"real=23"},{"id":44,"name":"Bouvier des Flandres","value":"real=24"},{"id":45,"name":"Boxer","value":"real=25"},{"id":46,"name":"Boykin Spaniel","value":"real=601"},{"id":47,"name":"Briard","value":"real=26"},{"id":48,"name":"Brittany","value":"real=27"},{"id":49,"name":"Brussels Griffon","value":"real=195"},{"id":50,"name":"Bull Terrier","value":"real=28"},{"id":51,"name":"Bulldog","value":"nick=1039"},{"id":52,"name":"Bullmastiff","value":"real=30"},{"id":53,"name":"Cairn Terrier","value":"real=31"},{"id":54,"name":"Canaan Dog","value":"real=381"},{"id":55,"name":"Canary Dog","value":"nick=1194"},{"id":56,"name":"Cane Corso","value":"real=461"},{"id":57,"name":"Cardigan Welsh Corgi","value":"nick=1036"},{"id":58,"name":"Carolina Dog","value":"real=805"},{"id":59,"name":"Catahoula Leopard Dog","value":"real=33"},{"id":60,"name":"Cattle Dog","value":"nick=1028"},{"id":61,"name":"Cavalier King Charles Spaniel","value":"real=34"},{"id":62,"name":"Chesapeake Bay Retriever","value":"real=35"},{"id":63,"name":"Chihuahua","value":"real=36"},{"id":64,"name":"Chinese Crested","value":"real=37"},{"id":65,"name":"Chow Chow","value":"real=38"},{"id":66,"name":"Clumber Spaniel","value":"real=196"},{"id":67,"name":"Cockapoo","value":"real=39"},{"id":68,"name":"Cocker Spaniel","value":"real=40"},{"id":69,"name":"Collie","value":"real=41"},{"id":70,"name":"Coonhound","value":"real=42"},{"id":71,"name":"Coonhounds (All Types)","value":"super=1014"},{"id":72,"name":"Corgi","value":"real=230"},{"id":73,"name":"Coton de Tulear","value":"real=521"},{"id":74,"name":"Curly-Coated Retriever","value":"real=1169"},{"id":75,"name":"Dachshund","value":"real=44"},{"id":76,"name":"Dalmatian","value":"real=45"},{"id":77,"name":"Dandie Dinmont Terrier","value":"real=199"},{"id":78,"name":"Deerhound","value":"nick=1060"},{"id":79,"name":"Doberman Pinscher","value":"real=46"},{"id":80,"name":"Dogo Argentino","value":"real=621"},{"id":81,"name":"Dogue de Bordeaux","value":"real=242"},{"id":82,"name":"Dutch Shepherd","value":"real=47"},{"id":83,"name":"English (Redtick) Coonhound","value":"real=1186"},{"id":84,"name":"English Bulldog","value":"real=29"},{"id":85,"name":"English Mastiff","value":"nick=1052"},{"id":86,"name":"English Pointer","value":"nick=1173"},{"id":87,"name":"English Setter","value":"real=49"},{"id":88,"name":"English Sheepdog","value":"nick=1042"},{"id":89,"name":"English Shepherd","value":"real=641"},{"id":90,"name":"English Springer Spaniel","value":"real=51"},{"id":91,"name":"English Toy Spaniel","value":"real=52"},{"id":92,"name":"Entlebucher","value":"real=808"},{"id":93,"name":"Eskimo Dog","value":"nick=1020"},{"id":94,"name":"Eskimo Spitz","value":"nick=1019"},{"id":95,"name":"Feist","value":"real=310"},{"id":96,"name":"Field Spaniel","value":"real=201"},{"id":97,"name":"Fila Brasileiro","value":"real=810"},{"id":98,"name":"Finnish Lapphund","value":"real=811"},{"id":99,"name":"Finnish Spitz","value":"real=54"},{"id":100,"name":"Flat-Coated Retriever","value":"real=202"},{"id":101,"name":"Fox Terrier (Smooth)","value":"real=812"},{"id":102,"name":"Fox Terrier (Toy)","value":"real=813"},{"id":103,"name":"Fox Terrier (Wirehaired)","value":"real=55"},{"id":104,"name":"Fox Terriers (All Types)","value":"super=1005"},{"id":105,"name":"Foxhound","value":"real=56"},{"id":106,"name":"French Bulldog","value":"real=203"},{"id":107,"name":"French Mastiff","value":"nick=1038"},{"id":108,"name":"German Pinscher","value":"real=814"},{"id":109,"name":"German Shepherd Dog","value":"real=57"},{"id":110,"name":"German Shorthaired Pointer","value":"real=58"},{"id":111,"name":"German Wirehaired Pointer","value":"real=204"},{"id":112,"name":"Giant Schnauzer","value":"nick=1171"},{"id":113,"name":"Glen of Imaal Terrier","value":"real=815"},{"id":114,"name":"Golden Retriever","value":"real=60"},{"id":115,"name":"Goldendoodle","value":"real=1369"},{"id":116,"name":"Gordon Setter","value":"real=61"},{"id":117,"name":"Great Dane","value":"real=62"},{"id":118,"name":"Great Pyrenees","value":"real=63"},{"id":119,"name":"Greater Swiss Mountain Dog","value":"real=205"},{"id":120,"name":"Greyhound","value":"real=64"},{"id":121,"name":"Halden Hound (Haldenstrover)","value":"real=661"},{"id":122,"name":"Harrier","value":"real=206"},{"id":123,"name":"Havanese","value":"real=501"},{"id":124,"name":"Hounds (All Types)","value":"super=1006"},{"id":125,"name":"Hounds (Scent Hounds)","value":"super=1008"},{"id":126,"name":"Hounds (Sight Hounds)","value":"super=1007"},{"id":127,"name":"Hovawart","value":"real=816"},{"id":128,"name":"Hungarian Puli","value":"nick=1195"},{"id":129,"name":"Hungarian Water Dog","value":"nick=1196"},{"id":130,"name":"Husky","value":"real=817"},{"id":131,"name":"Ibizan Hound","value":"real=281"},{"id":132,"name":"Irish Setter","value":"real=67"},{"id":133,"name":"Irish Terrier","value":"real=207"},{"id":134,"name":"Irish Water Spaniel","value":"real=208"},{"id":135,"name":"Irish Wolfhound","value":"real=68"},{"id":136,"name":"Italian Greyhound","value":"real=69"},{"id":137,"name":"Italian Spinone","value":"real=818"},{"id":138,"name":"Jack Russell Terrier","value":"real=70"},{"id":139,"name":"Japanese Chin","value":"real=71"},{"id":140,"name":"Jindo","value":"real=72"},{"id":141,"name":"Kai Dog","value":"real=819"},{"id":142,"name":"Karelian Bear Dog","value":"real=820"},{"id":143,"name":"Keeshond","value":"real=73"},{"id":144,"name":"Kerry Blue Terrier","value":"real=209"},{"id":145,"name":"King Charles Spaniel","value":"nick=1032"},{"id":146,"name":"Kishu","value":"real=821"},{"id":147,"name":"Komondor","value":"real=210"},{"id":148,"name":"Kuvasz","value":"real=74"},{"id":149,"name":"Kyi Leo","value":"real=822"},{"id":150,"name":"Labradoodle","value":"real=1170"},{"id":151,"name":"Labrador Retriever","value":"real=823"},{"id":152,"name":"Lakeland Terrier","value":"real=211"},{"id":153,"name":"Lancashire Heeler","value":"real=826"},{"id":154,"name":"Leonberger","value":"real=827"},{"id":155,"name":"Lhasa Apso","value":"real=76"},{"id":156,"name":"Löwchen","value":"real=1187"},{"id":157,"name":"Maltese","value":"real=77"},{"id":158,"name":"Manchester Terrier","value":"real=78"},{"id":159,"name":"Maremma Sheepdog","value":"real=828"},{"id":160,"name":"Mastiff","value":"real=200"},{"id":161,"name":"Mastiffs (All Types)","value":"super=1001"},{"id":162,"name":"Mexican Hairless","value":"nick=1061"},{"id":163,"name":"Miniature Pinscher","value":"real=80"},{"id":164,"name":"Miniature Poodle","value":"nick=1054"},{"id":165,"name":"Miniature Schnauzer","value":"nick=1058"},{"id":166,"name":"Mountain Cur","value":"real=829"},{"id":167,"name":"Munsterlander","value":"real=830"},{"id":168,"name":"Neapolitan Mastiff","value":"real=83"},{"id":169,"name":"Newfoundland","value":"real=84"},{"id":170,"name":"Norfolk Terrier","value":"real=214"},{"id":171,"name":"Norwegian Buhund","value":"real=831"},{"id":172,"name":"Norwegian Elkhound","value":"real=85"},{"id":173,"name":"Norwich Terrier","value":"real=215"},{"id":174,"name":"Nova Scotia Duck-Tolling Retriever","value":"real=832"},{"id":175,"name":"Old English Sheepdog","value":"real=302"},{"id":176,"name":"Otterhound","value":"real=87"},{"id":177,"name":"Papillon","value":"real=88"},{"id":178,"name":"Parson Russell Terrier","value":"nick=1172"},{"id":179,"name":"Patterdale Terrier (Fell Terrier)","value":"real=833"},{"id":180,"name":"Pekingese","value":"real=89"},{"id":181,"name":"Pembroke Welsh Corgi","value":"nick=1035"},{"id":182,"name":"Petit Basset Griffon Vendeen","value":"real=216"},{"id":183,"name":"Pharaoh Hound","value":"real=90"},{"id":184,"name":"Pit Bull Terrier","value":"nick=1021"},{"id":185,"name":"Plott Hound","value":"real=581"},{"id":186,"name":"Podengo Portugueso","value":"real=834"},{"id":187,"name":"Pointer","value":"real=92"},{"id":188,"name":"Polish Lowland Sheepdog","value":"real=1166"},{"id":189,"name":"Pomeranian","value":"real=93"},{"id":190,"name":"Poodle (Miniature)","value":"real=213"},{"id":191,"name":"Poodle (Standard)","value":"real=94"},{"id":192,"name":"Poodle (Toy or Tea Cup)","value":"real=226"},{"id":193,"name":"Poodles (All Types)","value":"super=1010"},{"id":194,"name":"Portuguese Water Dog","value":"real=95"},{"id":195,"name":"Presa Canario","value":"real=1188"},{"id":196,"name":"Pug","value":"real=96"},{"id":197,"name":"Puli","value":"real=1189"},{"id":198,"name":"Pumi","value":"real=835"},{"id":199,"name":"Rat Terrier","value":"real=218"},{"id":200,"name":"Redbone Coonhound","value":"real=664"},{"id":201,"name":"Redtick Coonhound","value":"nick=1193"},{"id":202,"name":"Retrievers (All Types)","value":"super=1011"},{"id":203,"name":"Rhodesian Ridgeback","value":"real=98"},{"id":204,"name":"Rottweiler","value":"real=99"},{"id":205,"name":"Russian Wolfhound","value":"nick=1029"},{"id":206,"name":"Saluki","value":"real=101"},{"id":207,"name":"Samoyed","value":"real=102"},{"id":208,"name":"Schiller Hound","value":"real=662"},{"id":209,"name":"Schipperke","value":"real=103"},{"id":210,"name":"Schnauzer (Giant)","value":"real=836"},{"id":211,"name":"Schnauzer (Miniature)","value":"real=837"},{"id":212,"name":"Schnauzer (Standard)","value":"real=104"},{"id":213,"name":"Schnauzers (All Types)","value":"super=1013"},{"id":214,"name":"Scottie, Scottish Terrier","value":"real=105"},{"id":215,"name":"Scottish Deerhound","value":"real=219"},{"id":216,"name":"Sealyham Terrier","value":"real=220"},{"id":217,"name":"Setters (All Types)","value":"super=1012"},{"id":218,"name":"Shar Pei","value":"real=107"},{"id":219,"name":"Sheep &amp; Herding Dogs","value":"super=994"},{"id":220,"name":"Sheltie, Shetland Sheepdog","value":"real=108"},{"id":221,"name":"Shepherds (All Types)","value":"super=1002"},{"id":222,"name":"Shiba Inu","value":"real=110"},{"id":223,"name":"Shih Tzu","value":"real=111"},{"id":224,"name":"Siberian Husky","value":"nick=1084"},{"id":225,"name":"Silky Terrier","value":"real=113"},{"id":226,"name":"Skye Terrier","value":"real=221"},{"id":227,"name":"Sloughi","value":"real=841"},{"id":228,"name":"Smooth Fox Terrier","value":"nick=1044"},{"id":229,"name":"Snow Dogs (Husky/Fluffy Types)","value":"super=993"},{"id":230,"name":"Spaniels (All Types)","value":"super=998"},{"id":231,"name":"Spaniels (Medium)","value":"super=1000"},{"id":232,"name":"Spaniels (Small)","value":"super=999"},{"id":233,"name":"Spitz Types (Large)","value":"super=995"},{"id":234,"name":"Spitz Types (Medium)","value":"super=996"},{"id":235,"name":"Spitz Types (Small)","value":"super=997"},{"id":236,"name":"Springer Spaniel","value":"nick=1043"},{"id":237,"name":"St. Bernard","value":"real=100"},{"id":238,"name":"Staffordshire Bull Terrier","value":"nick=1022"},{"id":239,"name":"Standard Poodle","value":"nick=1055"},{"id":240,"name":"Standard Schnauzer","value":"nick=1059"},{"id":241,"name":"Sussex Spaniel","value":"real=222"},{"id":242,"name":"Swedish Vallhund","value":"real=846"},{"id":243,"name":"Tea Cup Poodle","value":"nick=1057"},{"id":244,"name":"Terriers (Medium)","value":"super=1004"},{"id":245,"name":"Terriers (Small)","value":"super=1003"},{"id":246,"name":"Thai Ridgeback","value":"real=561"},{"id":247,"name":"Tibetan Mastiff","value":"real=224"},{"id":248,"name":"Tibetan Spaniel","value":"real=225"},{"id":249,"name":"Tibetan Terrier","value":"real=118"},{"id":250,"name":"Tosa Inu","value":"real=848"},{"id":251,"name":"Toy Fox Terrier","value":"nick=1046"},{"id":252,"name":"Toy Poodle","value":"nick=1056"},{"id":253,"name":"Treeing Walker Coonhound","value":"real=119"},{"id":254,"name":"Vizsla","value":"real=120"},{"id":255,"name":"Weimaraner","value":"real=121"},{"id":256,"name":"Welsh Corgi","value":"nick=1037"},{"id":257,"name":"Welsh Springer Spaniel","value":"real=849"},{"id":258,"name":"Welsh Terrier","value":"real=227"},{"id":259,"name":"Westie, West Highland White Terrier","value":"real=123"},{"id":260,"name":"Wheaten Terrier","value":"real=124"},{"id":261,"name":"Whippet","value":"real=125"},{"id":262,"name":"Wirehaired Fox Terrier","value":"nick=1045"},{"id":263,"name":"Wirehaired Pointing Griffon","value":"real=127"},{"id":264,"name":"Xoloitzcuintle/Mexican Hairless","value":"real=212"},{"id":265,"name":"Yorkie, Yorkshire Terrier","value":"real=244"}];
            var dogAgeOptions = [
              {name:'Any', value:''},
              {name:'Puppy', value: 'puppy'},
              {name:'Young', value: 'young'},
              {name:'Adult', value: 'adult'},
              {name:'Senior', value: 'senior'}];
            var dogSizeField = {
              displayName: 'Size',
              name: 'size',
              options: [
                {name: 'Any', value: ''},
                {name: 'Small 25 lbs (11 kg) or less', value: 1},
                {name: 'Med. 26-60 lbs (12-27 kg)', value: 2},
                {name: 'Large 61-100 lbs (28-45 kg)', value: 3},
                {name: 'X-Large 101 lbs (46 kg) or more', value: 4},
              ]
            };

            // General Form Fields
            var formFields = {
              breed: {
                name:'breed',
                displayName:'Breed'
              },
              gender: {
                name: 'gender',
                displayName: 'Gender',
                options: [
                  {name: 'Any', value:''},
                  {name:'Male', value: 'm'},
                  {name:'Female', value: 'f'}]
              },
              age: {
                name: 'age',
                displayName: 'Age'
              }
            };

            if (species.toLowerCase() === 'cat') {
              formFields.age.options = catAgeOptions;
              formFields.breed.options = catBreedOptions;
              formFields.hair = catHairField;
            } else if (species.toLowerCase() === 'dog') {
              formFields.age.options = dogAgeOptions;
              formFields.breed.options = dogBreedOptions;
              formFields.size = dogSizeField;
            }

            return formFields;
          };
        }])

        .controller('SearchCtrl', function ($window, $scope, $location, AdoptionCache, QueryParams, PetFormFields) {
          AdoptionCache.put('scrollX', 0);
          var searchCache = (AdoptionCache.get('searchData') || {});

          $scope.processingForm = false;
          $scope.searchData = searchCache;
          $scope.searchData.city_or_zip = QueryParams('city_or_zip');
          if (! $scope.searchData.city_or_zip || $scope.searchData.city_or_zip.length === 0) {
            $scope.cityZipError = true;
          }

          function setFormFields(species) {
            species = (species === 'cat') ? 'cat' : 'dog';
            $scope.searchData.species = species;

            var formFields = PetFormFields(species);
            $scope.selectFormFields = formFields;
            $scope.selectBox = {};

            angular.forEach(formFields, function(data, key) {
              var searchDataValue = $scope.searchData[key]
              $scope.searchData[key] = (searchDataValue) ? searchDataValue : data.options[0].value;
              $scope.selectBox[key] = 0;
            });
          }

          $scope.setType = function(type) {
            $scope.searchData.breed = '';
            $scope.searchData.gender = '';
            $scope.searchData.age = '';
            $scope.searchData.size = '';
            $scope.searchData.hair = '';

            setFormFields(type);
          };

          $scope.setType( (searchCache.species || 'dog') );



          $scope.selectChange = function(fieldName) {
            var index = $scope.selectBox[fieldName];
            $scope.searchData[fieldName] = $scope.selectFormFields[fieldName].options[index].value;
          }

          $scope.submit = function() {
            $scope.processingForm = true;
            var searchData = $scope.searchData;

            if (searchData.species === 'dog') {
              $location.path('/results')
                .search('city_or_zip', searchData.city_or_zip)
                .search('species', searchData.species)
                .search('breed', searchData.breed)
                .search('gender', searchData.gender)
                .search('age', searchData.age)
                .search('size', searchData.size)
                ;
            } else if (searchData.species === 'cat') {
              $location.path('/results')
                .search('city_or_zip', searchData.city_or_zip)
                .search('species', searchData.species)
                .search('breed', searchData.breed)
                .search('gender', searchData.gender)
                .search('age', searchData.age)
                .search('hair', searchData.hair)
                ;
            }

          };

        })

        .controller('ResultsCtrl', function ($window, $scope, $routeParams, $http, $location, AdoptionCache, PetListService, QueryParams) {
          var searchData = $location.search();

          $scope.iScrollParameters = {
            scrollX: true,
            scrollY: false,
            mouseWheel: true
          };

          // Bring user back to the scroll position they left off at
          $scope.scrollX = (AdoptionCache.get('scrollX') || 0);
          $scope.scrollFeedback = function(x, y) {
            AdoptionCache.put('scrollX', x);
          }

          $scope.searching = true;
          $scope.speciesText = searchData.species[0].toUpperCase() + searchData.species.substring(1) + 's';
          $scope.locationName = QueryParams('location') ? QueryParams('location') : 'You';
          AdoptionCache.put('searchData', searchData);

          PetListService(searchData)
            .then( function(pets) {
              // put petsmart parnter pets first
              pets.sort(function(a, b) {
                return (a.is_petsmart_partner < b.is_petsmart_partner);
              });

              var halfCount = Math.floor((pets.length + 1) / 2);
              $scope.topPetList = pets.slice(0, halfCount);
              $scope.bottomPetList = pets.slice(halfCount);
            }, function(err) {
              console.log('Error', err);
              $scope.error = err;
            })
            .finally(function() {
              $scope.searching = false;
            });
        })

        .controller('DetailsCtrl', function ($window, $location, $scope, $routeParams, $http, PetService) {

          $scope.searching = true;

          $scope.setMainImage = function(image) {
            $scope.mainImage = image;
          };

          var mainImageSize = function(image) {
            var maxHeight = 600;
            var maxWidth = 600;
            var ratio = image.original_width / image.original_height;

            if (image.original_width >= image.original_height) {
              // console.log( 'width larger: ', {width: maxWidth, height: maxWidth / ratio });
              return {width: maxWidth, height: maxWidth / ratio };
            } else if (image.original_width < image.original_height) {
              // console.log( 'height larger: ', {width: maxHeight * ratio, height: maxHeight});
              return {width: maxHeight * ratio, height: maxHeight};
            }
          };


          var thumbnailSize = function(image) {
            var thumbnailHeight = 130;
            var ratio = image.thumbnail_width / image.thumbnail_height;
            var thumbnailWidth = thumbnailHeight * ratio;

            return {width: thumbnailWidth, height: thumbnailHeight};
          };

          $scope.mainImageSize = mainImageSize;
          $scope.thumbnailSize = thumbnailSize;

          if ($routeParams.id) {
            PetService($routeParams.id)
              .then(function(pet) {
                $scope.pet = pet;

                // only allow 6 images for the pet details
                angular.forEach($scope.pet.images, function(image, index) {
                  if (index === 0)  {
                    $scope.setMainImage(image);
                  }
                  // preload images
                  var img = new Image();
                  img.src = image.original_url;
                });

              }, function(err) {
                console.log('Error', err);
                $scope.error = err;
              })
              .finally(function() {
                $scope.searching = false;
              });

          } else {
            $location.path( "/search" );
          }

          $scope.goBack = function( ) {
            $window.history.back();
          }
        })
        ;
