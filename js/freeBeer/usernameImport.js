var UsernameImport = {};

UsernameImport['instagram'] = {
	'client_id': 'a62caaef5b6047d68445bb91653e585b',
	'redirect_uri': 'http://www.freebeer.com/ig',
	'profile_url': 'https://api.instagram.com/v1/users/self/'
};
UsernameImport.instagram.requestAuthentication = function() {
	var auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + UsernameImport.instagram.client_id + '&redirect_uri=' + UsernameImport.instagram.redirect_uri + '&response_type=code';
	window.location = auth_url;
}
UsernameImport.instagram.processAuthentication = function() {
	// check if there is any error
	if (window.location.search.length > 1) {
		if (window.location.search.indexOf('error=') != -1) {
			return false;
		}
	}

	var hash = window.location.hash.substr(1);
	var token = hash.match(/access_token=([^#]+)/i);
	if (token.length != 0) token = token[1];


	// get JSON from url
	var profile_prom = PuffNet.getJSON(UsernameImport.instagram.profile_url, {access_token: token});
	profile_prom.then(function(profile){
		if (profile.meta.code == 200) {
			var username = profile.data.username;
			// token
			var auth = 'instagram';
			return {username: username, token: token, auth: auth};
		}
	})
}
