Ceres.admin.manageApplications = (function(){
	
	var inputs = ["name", "token", "website"];
	
	var cId = "";
	
	function init() {
		$("#manage-app-save").on('click', function(){
			_save();
		});
	}
	
	function show() {
		var hash = window.location.hash.replace(/#/,"").split("/");
		
		if( hash.length == 1 ) {
			_showTable();
		} else {
			cId = hash[1];
			_showForm();
		}
	}
	
	function _save() {
		if( $("#manage-app-save").hasClass("disabled") ) return;
		
		var app = {};
		for( var i = 0; i < inputs.length; i++ ) {
			app[inputs[i]] = $("#manage-app-"+inputs[i]).val();
			if( !app[inputs[i]] ) return alert("Please provide a "+inputs[i]);
		}
		app._id = cId;
		
		$("#manage-app-save").addClass("disabled").html("Saving...");
		
		$.ajax({
			url  : "/rest/updateApplication",
			type : "POST",
			data : app,
			success : function(resp) {
				if( resp.error ) {
					alert(resp.message);
				} else {
					alert("App Updated");
					_loadApps(function(){
						_showTable();
					});
				}
				$("#manage-app-save").removeClass("disabled").html("Save");
			},
			error : function() {
				alert("server error");
				$("#manage-app-save").removeClass("disabled").html("Save");
			}
		});
	}
	
	function _loadApps(callback) {
		$.ajax({
			url : "/rest/getApplications",
			type : "GET",
			success : function(resp) {
				Ceres.admin.apps = resp.apps;
				
				Ceres.admin.apps.sort(function(a,b){
					return b.name < a.name;
				});
				
				callback();
			},
			error : function() {
				window.alert("Failed to talk to server");
			}
		});
	}
	
	function _showTable() {	
		$("#manage-app-table").show();
		$("#manage-app-form").hide();
		
		// create table
		var table = '<table class="table table-hover"><thead>' +
		'<tr><th>Application</th><th>Token</th><th>Website</th><th></th></tr></thead><tbody>';
		for( var i = 0; i < Ceres.admin.apps.length; i++ ) {
			var app = Ceres.admin.apps[i];
			table += '<tr><td>'+app.name+'</td><td>'+app.token + 
					 '</td><td><a href="'+app.website+'" target="_blank">'+app.website+'</a></td>'+
					 '<td><a class="btn btn-primary" href="/#manageApplications/'+app._id+'">Edit</a></td></tr>';
		}
		table += "</tbody></table>";
		
		if( !Ceres.admin.apps || Ceres.admin.apps.length == 0 ) table = "No apps found :/";
		
		$("#manage-app-table").html(table);
	}
	
	function _showForm() {
		$("#manage-app-table").hide();
		$("#manage-app-form").show();
		
		_clear();
		
		
		for( var i = 0; i < Ceres.admin.apps.length; i++ ) {
			if( Ceres.admin.apps[i]._id == cId ) {
				var app = Ceres.admin.apps[i];	
				for( var key in app ) {
					var t = app[key];
					var t2 = $("#manage-app-"+key);
					$("#manage-app-"+key).val(app[key]);
				}
				return;
			}
		}
	}
	
	function _clear() {
		for( var i = 0; i < inputs.length; i++ ) {
			$("#create-app-"+inputs[i]).val("");
		}
	}
	
	
	return {
		init : init,
		show : show
	}
	
})();