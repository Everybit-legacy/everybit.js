var UsernameImport = {};

UsernameImport['instagram'] = {
	'client_id': 'a62caaef5b6047d68445bb91653e585b',
	'redirect_uri': 'http://www.everybit.com/r/ig'
};
UsernameImport.instagram.requestAuthentication = function() {
	var auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + UsernameImport.instagram.client_id + '&redirect_uri=' + UsernameImport.instagram.redirect_uri + '&response_type=code';
	window.location = auth_url;
};
UsernameImport.instagram.importContent = function(username, userid, access_token) {
	var content_url = "https://api.instagram.com/v1/users/" + userid + "/media/recent/";

	var prom = PuffNext.getJSON(url, {access_token: access_token, count: 100})
	prom.then(function(result){
		if (result.meta.code == 200) {
			var data = result.data;
			for (var i=0; i<data.length; i++) {
				var entry = data[i];
				if (entry.type != 'image') continue;

				var img_el = document.createElement("img");
				img_el.setAttribute('src', entry.images['standard_resolution']['url']);
				img_el.setAttribute('width', entry.images['standard_resolution']['width']);
				img_el.setAttribute('height', entry.images['standard_resolution']['height'])
				var img = getBase64Image(img_el);

				var metadata = {
					time: entry.created_time * 1000,
					tags: entry.tags,
					title: entry.caption.text
				}
				var post_prom = PuffForum.addPost('image', image_url, [], metadata);
				post_prom.then(function(puff){
					console.log(puff.sig);
				})
			}
		}
	})
	return prom;
}


UsernameImport['reddit'] = {
	'client_id': '1qm_OqK_sUCRrA',
	'redirect_uri': 'http://www.everybit.com/r/reddit/'
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
};
