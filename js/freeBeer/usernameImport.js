var UsernameImport = {};

UsernameImport['instagram'] = {
	'client_id': 'a62caaef5b6047d68445bb91653e585b',
	'redirect_uri': 'http://www.freebeer.com/ig'
};
UsernameImport.instagram.requestAuthentication = function() {
	var auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + UsernameImport.instagram.client_id + '&redirect_uri=' + UsernameImport.instagram.redirect_uri + '&response_type=code';
	window.location = auth_url;
};

UsernameImport['reddit'] = {
	'client_id': '1qm_OqK_sUCRrA',
	'redirect_uri': 'http://localhost/username_import/reddit.html'
};
UsernameImport.reddit.requestAuthentication = function() {
	var state = ''; // a random string that can use later for verification
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	for (var i=0; i<10; i++) {
		var index = Math.floor(Math.random() * possible.length);
		state += possible[index];
	}
	var auth_url = 'https://ssl.reddit.com/api/v1/authorize?client_id=' + UsernameImport.reddit.client_id + '&response_type=code&state=' + state + '&redirect_uri=' + UsernameImport.reddit.redirect_uri + '&duration=temporary&scope=identity';
	window.location = auth_url;
	/**
	 * get access_token: POST https://ssl.reddit.com/api/v1/access_token with grant_type=authorization_code&code=CODE&redirect_uri=URI
	 * get user information: GET https://oauth.reddit.com/api/v1/me.json with aUTHORIZATOIN: bearer TOKEN
	 */
};
