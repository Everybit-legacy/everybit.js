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
	'client_id': '',
	'redirect_uri': 'http://www.freebeer.com/reddit'
};
UsernameImport.reddit.requestAuthentication = function() {
	var state = '';
	var auth_url = 'https://ssl.reddit.com/api/v1/authorize?client_id=' + UsernameImport.reddit.client_id + '&response_type=code&state=' + state + '&redirect_uri=' + UsernameImport.reddit.redirect_uri + '&duration=temporary&scope=identity';
	window.location = auth_url;
};
