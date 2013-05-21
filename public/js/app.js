if( !window.Ceres ) {
	window.Ceres = {
			admin : {}
	};
}

Ceres.admin.app = (function() {
	
	$(document).ready(function() {
		
		$.ajax({
			url : "/admin/rest/isLoggedIn",
			type : "GET",
			success : function(info) {
				if( !info.status ) return window.location = "/login.html";
				Ceres.admin.user = info.user;
				_loadApps();
			},
			error : function() {
				window.alert("Failed to talk to server");
			}
		});
		
	});
	
	function _loadApps() {
		$.ajax({
			url : "/rest/getApplications",
			type : "GET",
			success : function(resp) {
				Ceres.admin.apps = resp.apps;
				
				Ceres.admin.apps.sort(function(a,b){
					return b.name < a.name;
				});
				
				_onUserLogin();
			},
			error : function() {
				window.alert("Failed to talk to server");
			}
		});
	}
	
	
	function _onUserLogin() {
		for( var i in Ceres.admin) {
			if( Ceres.admin[i] && Ceres.admin[i].init ) Ceres.admin[i].init();
		}
		
		_parseHash();
		$(window).on('hashchange', function(){
			_parseHash();
		});
	}
	
	function _parseHash() {
		var hash = window.location.hash.replace(/#/,"").split("/");
		
		if( hash.length == 0 || hash[0] == "" ) return _showPage("home");
		
		_showPage(hash[0]);
		
	}
	
	function _showPage(page) {
		$(".page").hide();
		$("#"+page).show();
		
		if( Ceres.admin[page] && Ceres.admin[page].show ) Ceres.admin[page].show();
	}
	
	
	
})();