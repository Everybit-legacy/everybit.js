Freebeer
========
`Freebeer` is a demo GUI front end to the Puffball project. 

Puffball is a decentralized discussion platform. Front end web & mobile developers can create their own GUI front end to Puffball, using the Puffball API, to host their own Puffball server. All user content is encrypted via the Blockchain, allowing a secure & decentralized social platform for sharing of text, audio, video and images.

### Current Development
`Freebeer` currently reads data from a sample JSON file so GUI development can continue in parallel with Puffball's API team. Once Puffball's API is released `Freebeer` will connect to the live API. 

`Freebeer` and Puffball are currently in Phase 1 of the Development roadmap. The TODO list is located on Trello: https://trello.com/puffball

### Running the app examples.
Basics: Clone this Repository to your local machine. Or download the ZIP file here:
https://github.com/puffball/freebeer/archive/master.zip

To run the static mock up: open this file in a browser:
/server/static-mock/indexFriday.html

To try the Angular app: follow the instructions here:
/client-angular/README.md 

In a nut shell, from this directory /client-angular/ just run: npm start
You will need NPM (Node Package Manager) to be installed but again, the instructions are in the above mentioned README.

Note: This repo currently includes the AngularJS libs so you dont't need to run npm install.


### More Dev notes
`Freebeer` uses the following libraries, if there's a CDN we're pointing to it instead of loading it all into GitHub:
   [jQuery](http://www.jquery.com), 
   [jQueryUI](http://www.jqueryui.com), 
   [jsPlumb](http://jsplumbtoolkit.com/demo/home/jquery.html), 
   [FontAwesome](http://fortawesome.github.io/Font-Awesome).
   [AngularJS](http://angularjs.org/).

### Puffball
Puffball's [GitHub page is here.](https://github.com/puffball/puffball)

Please see the [guide to the puffball platform](http://extrazoom.com/image-10847.html) This guide visually outlines Puffball usage and provides an overview of the development roadmap, user accounts/naming, user generated content, the Blockchain, and the Freebeer demo GUI.

The main Puffball site is here [www.PuffBall.io](http://www.puffball.io)

### Contributor Guide
Before making any changes or Pull requests please check the issues and/or post a question here to coordinate tasks. This will help avoid duplicate efforts. Happy coding :-)
https://github.com/puffball/freebeer/issues?state=open

Please don't edit files on the Master repository. Create a branch or a Fork. This will help avoid collisions and prevent defects from being introduced from merges & pull requests.

Submit feature requests, questions, bugs, etc here:
https://github.com/puffball/freebeer/issues


License: [MIT](http://opensource.org/licenses/MIT)
