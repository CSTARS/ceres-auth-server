Ceres.admin.users = (function(){
	
	var users = [];
	
	function init() {
		
	}
	
	function show() {
		$("#users-table").html("");
		
		$.ajax({
			url     : "/rest/getUsers",
			success : function(resp) {
				if( resp.error ) return alert(resp.message);
				users = resp.users;
				_updateTable(resp.users);
			},
			error : function() {
				alert("server error");
			}
		});
	}
	
	function _updateTable(data) {
		// create table
		var table = '<table class="table table-hover"><thead>' +
		'<tr><th>User</th><th>Application</th><th>Authority</th><th>Date Registered</th><th>Roles</th><th></th></tr></thead><tbody>';
		for( var i = 0; i < data.length; i++ ) {
			
			table += '<tr id="'+data[i]._id+'"><td>'+data[i].username+'</td><td>'+_getAppName(data[i].app) + 
					 '</td><td>'+data[i].authority+'</td><td>'+_niceDate(data[i].timestamp)+'</td><td>'+_getRoles(data[i])+'</td>'+
					 '<td><a href="#editUser/'+data[i]._id+'" class="btn">Edit<a></td></tr>';
		}
		table += "</tbody></table>";
		
		if( data.length == 0 ) table = "No active users";
		
		$("#users-table").html(table);
		
		

	}
	
	function _getRoles(user) {
		if( !user.roles ) return "";
		
		var roles = "";
		for( var i = 0; i < user.roles.length; i++ ) {
			roles += user.roles[i];
			if( i < user.roles.length - 1 ) roles += ", ";
		}
		return roles;
	}
	
	function _niceDate(timestamp) {
		if( !timestamp ) return "";
		var d = new Date(timestamp);
		return (d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear();
	}
	
	function _getAppName(id) {
		for( var i = 0; i < Ceres.admin.apps.length; i++ ) {
			if( Ceres.admin.apps[i]._id == id) return Ceres.admin.apps[i].name;
		}
		return "";
	}
	
	return {
		init : init,
		show : show
	}
	
})();