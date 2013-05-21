Ceres.admin.createApplication = (function(){
	
	var inputs = ["name", "token", "website"];
	
	function init() {
		$("#create-app-save").on('click', function(){
			_save();
		});
	}
	
	
	function _save() {
		if( $("#create-app-save").hasClass("disabled") ) return;
		
		var app = {};
		for( var i = 0; i < inputs.length; i++ ) {
			app[inputs[i]] = $("#create-app-"+inputs[i]).val();
			if( !app[inputs[i]] ) return alert("Please provide a "+inputs[i]);
		}
		
		$("#create-app-save").addClass("disabled").html("Saving...");
		
		$.ajax({
			url  : "/rest/addApplication",
			type : "POST",
			data : app,
			success : function(resp) {
				if( resp.error ) {
					alert(resp.message);
				} else {
					alert("App Created");
					_clear();
					_loadApps();
				}
				$("#create-app-save").removeClass("disabled").html("Save");
			},
			error : function() {
				alert("server error");
				$("#create-app-save").removeClass("disabled").html("Save");
			}
		});
	}
	
	function _loadApps() {
		$.ajax({
			url : "/rest/getApplications",
			type : "GET",
			success : function(resp) {
				Ceres.admin.apps = resp.apps;
				
				Ceres.admin.apps.sort(function(a,b){
					return b.name < a.name;
				});
			},
			error : function() {
				window.alert("Failed to talk to server");
			}
		});
	}
	
	function _clear() {
		for( var i = 0; i < inputs.length; i++ ) {
			$("#create-app-"+inputs[i]).val("");
		}
	}
	
	
	return {
		init : init
	}
	
})();