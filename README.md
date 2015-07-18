# pet-board-adoption
Pet Board adoption widget built with Angular and Twitter bootstrap. While the application is a static HTML/javascript codebase, the project provides a simple node/Express server to run the project on port 3000.

```$ node server.js```

# Initial Values
The application url require a zip code to run the search for pets available.  With the project running, this is done with a url such as

**http://localhost:3000/?city_or_zip=91304**

The application route may take another location parameter, to explicitly showcase the area being searched. This example uses West Hills, CA as the location being searched

**http://localhost:3000/?city_or_zip=91304&location=West%20Hills,%20CA#/**

# Adopt-A-Pet API
The application uses the adopt-a-pet api to search for pets that are available in a 50 mile radius

[http://www.adoptapet.com/](http://www.adoptapet.com/)

#### The search API url used in the site is hard coded with the following
**https://api.adoptapet.com/search/pet_search?key=14a00a8f876f8227692a72fa5102e149&geo_range=50&v=2&output=json**
