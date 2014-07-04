var UsernameImport = {};

UsernameImport['instagram'] = {
	'client_id': 'a62caaef5b6047d68445bb91653e585b',
	'redirect_uri': 'http://www.everybit.com/r/ig'
};
UsernameImport.instagram.requestAuthentication = function() {
	var auth_url = 'https://api.instagram.com/oauth/authorize/?client_id=' + UsernameImport.instagram.client_id + '&redirect_uri=' + UsernameImport.instagram.redirect_uri + '&response_type=code';
	window.location = auth_url;
};
UsernameImport.instagram.importContent = function(result){
	var allImages = [];
	if (result.meta.code == 200) {
		var data = result.data;
		for (var i=0; i<data.length; i++) {
			var entry = data[i];
			if (entry.type != 'image') continue;

			var img_el = document.createElement("img");
			img_el.crossOrigin = '';
			var src = entry.images['standard_resolution']['url'];
			src = "http://162.219.162.56:8080/" + src.split('/').slice(2).join('/');
			var width  = entry.images['standard_resolution']['width'];
			var height = entry.images['standard_resolution']['height'];
			img_el.setAttribute('src', src);
			img_el.setAttribute('width', width);
			img_el.setAttribute('height', height);

			img_el.onload = function() {
				// getBase64Image
			    // Create an empty canvas element
			    var canvas = document.createElement("canvas");
			    canvas.height = width;
			    canvas.width = height;

			    var ctx = canvas.getContext("2d");
			    var img = "";
			    var img_el = this;
		    	ctx.drawImage(img_el, 0, 0);
				img = canvas.toDataURL('image/jpeg');

				var metadata = {
					time: entry.created_time * 1000,
					tags: entry.tags,
					caption: entry.caption.text
				}

				allImages.push({img: img, metadata:metadata});
				
				var post_prom = PuffForum.addPost('image', img, [], metadata);
				post_prom.then(function(puff){
					console.log(puff.sig);
				}).catch(function(err){
					console.log(err.message);
				})
			}
		}
	}
}
UsernameImport.instagram.contentURL = function(username, userid, access_token) {
	var content_url = "https://api.instagram.com/v1/users/" + userid + "/media/recent/?access_token=" + access_token + "&count=100&callback=UsernameImport.instagram.importContent";
	var newScript_el = document.createElement('script');
	newScript_el.setAttribute("src", content_url);
	newScript_el.setAttribute("id", "instagramContent");
	document.getElementsByTagName('head')[0].appendChild(newScript_el);
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
