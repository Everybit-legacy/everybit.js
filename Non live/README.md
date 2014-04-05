Coding Guidelines
========

General
-------------

* Whenever using files from an external source, copy them over into our repository. This makes it faster to debug (since the files are called locally), and avoids any issues with changes made to the external source.

* Put any scripts and libraries from external sources in the /scripts folder. Our own scripts can go in /js

* Use non-minified versions whenever possible, as this makes it easier to debug errors.

* CoffeeScript is welcome, especially for classes.

Code style
-------------
* Use camelCase for variable names, except classes, which should be "new ClassName()", and the CONFIG global (see next item)

* Configuration variables should go in the global CONFIG object defined in js/config.js

