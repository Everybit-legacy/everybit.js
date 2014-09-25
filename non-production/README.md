Coding Guidelines
========

General
-------------

* Before making any changes or Pull requests please check the issues and/or post a question here to coordinate tasks. This will help avoid duplicate efforts. Happy coding :-)
https://github.com/puffball/freebeer/issues?state=open

* Please don't edit files on the Master repository. Create a branch or a Fork. This will help avoid collisions and prevent defects from being introduced from merges & pull requests.

* Submit feature requests, questions, bugs, etc here:
https://github.com/puffball/freebeer/issues

* Whenever using files from an external source, copy them over into our repository. This makes it faster to debug (since the files are called locally), and avoids any issues with changes made to the external source.

* Put any scripts and libraries from external sources in the /scripts folder. Our own scripts can go in /js

* Use non-minified versions whenever possible, as this makes it easier to debug errors.

Code style
-------------
* Use camelCase for variable names, except classes, which should be "new ClassName()", and the CONFIG global (see next item)

* Configuration variables should go in the global CONFIG object defined in js/everybit/config.js

* This JavaScript style guide from Google is a good reference, AngularJS recommends this too:
https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml



