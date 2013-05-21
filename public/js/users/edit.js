Ceres.admin.editUser = (function(){
	
	var inputs = ["username", "authority", "password", "app", "roles"];
	var cUser = null;
	
	function init() {
		$("#edit-user-save").on('click', function() {
			_save();
		});
		
		$("#edit-user-delete").on('click', function() {
			_delete();
		});
	}
	
	function show() {
		_clear();
		
		var parts = window.location.hash.replace(/#/,'').split("/"); 
		if( parts.length > 1 ) {
			$.ajax({
				url  : "/rest/getUserInfo?id="+parts[1],
				success : function(resp) {
					if( resp.error ) {
						alert(resp.message);
					} else {
						cUser = resp;
						_setUserData();
					}
				},
				error : function() {
					alert("server error");
				}
			});
		} else {
			alert("error")
		}
	}
	
	function _setUserData() {
		$("#edit-user-username").html("<b>Username:</b> "+cUser.username);
		$("#edit-user-authority").html("<b>Authority:</b> "+cUser.authority);
		
		$("#edit-user-app").html("");
		for( var i = 0; i < Ceres.admin.apps.length; i++ ) {
			if( Ceres.admin.apps[i]._id == cUser.app ) {
				$("#edit-user-app").html("<b>App:</b> "+Ceres.admin.apps[i].name);
				break;
			}
		}
		
		if( cUser.roles ) {
			var txt = "";
			for( var j = 0; j < cUser.roles.length; j++ ) {
				txt += cUser.roles[j];
				if( j < cUser.roles.length - 1 ) txt += ", ";
			}
			$("#edit-user-roles").val(txt);
		}
		
		if( cUser.authority == "ceres" ) $("#edit-user-resetpass").show();
		else $("#edit-user-resetpass").hide();
	}
	
	function _save() {
		if( $("#edit-user-save").hasClass("disabled") ) return;

		var roles =  $("#edit-user-roles").val();
		if( roles ) {
			cUser.roles = roles.replace(/\s/g,'').split(",");
		}
		
		$("#edit-user-save").addClass("disabled").html("Saving...");
		
		$.ajax({
			url  : '/rest/setUserRoles',
			type : "POST",
			data : cUser,
			success : function(resp) {
				if( resp.error ) {
					alert(resp.message);
				} else {
					alert("User Roles Updated");
					_clear();
				}
				$("#edit-user-save").removeClass("disabled").html("Save");
			},
			error : function() {
				alert("server error");
				$("#edit-user-save").removeClass("disabled").html("Save");
			}
		});
	}
	
	function _delete() {
		if( $("#edit-user-delete").hasClass("disabled") ) return;
		if( !confirm("Are you sure you want to delete this user?  Forever!?!") ) return;

		$.ajax({
			url  : '/rest/deleteUser?id='+cUser._id,
			success : function(resp) {
				$("#edit-user-delete").removeClass("disabled").html("Delete");
				if( resp.error ) {
					alert(resp.message);
				} else {
					alert("User Deleted");
					window.location = "#users";
				}
			},
			error : function() {
				alert("server error");
				$("#edit-user-delete").removeClass("disabled").html("Delete");
			}
		});
	}
	
	function _clear() {
		for( var i = 0; i < inputs.length; i++ ) {
			$("#create-user-"+inputs[i]).val("");
		}
	}
	
	
	return {
		init : init,
		show : show
	}
	
})();