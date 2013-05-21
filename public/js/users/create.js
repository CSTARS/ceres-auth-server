Ceres.admin.createUser = (function(){
	
	var inputs = ["username", "authority", "password", "app", "roles"];
	var cUser = null;
	
	function init() {
		$("#create-user-save").on('click', function() {
			_save();
		});
		
		var select = $("#create-user-app");
		for( var i = 0; i < Ceres.admin.apps.length; i++ ) {
			var app = Ceres.admin.apps[i];
			select.append($("<option value='"+app._id+"'>"+app.name+"</option>"))
		}
	}
	
	function _save() {
		if( $("#create-user-save").hasClass("disabled") ) return;
		
		var user = {};
		for( var i = 0; i < inputs.length; i++ ) {
			user[inputs[i]] = $("#create-user-"+inputs[i]).val();
		}
		
		if( user.roles ) {
			user.roles = user.roles.replace(/\s/g,'').split(",");
		}
		
		
		if( !user.username ) return alert("Please provide a username");
		if( !user.app ) return alert("Please provide a app");
		if( !user.authority && !user.password ) return alert("Please provide a oauth authority or password");
		
		$("#create-user-save").addClass("disabled").html("Saving...");
		
		var url = "/rest/addCeresUser";
		if( user.authority && user.authority.length > 0 ) {
			url = "/rest/addOauthUser";
		}
		
		
		$.ajax({
			url  : url,
			type : "POST",
			data : user,
			success : function(resp) {
				if( resp.error ) {
					alert(resp.message);
				} else {
					alert("User Created");
					_clear();
				}
				$("#create-user-save").removeClass("disabled").html("Save");
			},
			error : function() {
				alert("server error");
				$("#create-user-save").removeClass("disabled").html("Save");
			}
		});
	}
	
	function _clear() {
		for( var i = 0; i < inputs.length; i++ ) {
			$("#create-user-"+inputs[i]).val("");
		}
	}
	
	
	return {
		init : init
	}
	
})();