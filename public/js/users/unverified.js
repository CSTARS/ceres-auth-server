Ceres.admin.unverifiedUsers = (function(){

	var selectedIds = [];
	
	function init() {
		$("#unverified-reject").on('click',  function(){
			if( $(this).hasClass("disabled") ) return;
			if( !confirm("Are you sure you want to reject these users?") ) return;
			
			$(this).addClass("disabled").html("Rejecting...");
			
			$.ajax({
				url      : "/rest/rejectUnverifyCeresUser",
				type     : "POST",
				data     : {ids : selectedIds},
				success : function(resp) {
					$("#unverified-reject").removeClass("disabled").html("Reject");
					if( resp.error ) {
						alert(resp.message);
					} else {
						show();
					}
				},
				error    : function() {
					alert("Server Error");
					$("#unverified-reject").removeClass("disabled").html("Reject");
				}
			});
		});
		
		$("#unverified-resend").on('click',  function(){
			if( $(this).hasClass("disabled") ) return;
			if( !confirm("Are you sure you want to resend emails these users?") ) return;
			
			$(this).addClass("disabled").html("Emailing...");
			
			$.ajax({
				url      : "/rest/resendUnverifyCeresUserEmail",
				type     : "POST",
				data     : {ids : selectedIds},
				success : function(resp) {
					$("#unverified-resend").removeClass("disabled").html("Resend Verification Email");
					if( resp.error ) {
						alert(resp.message);
					} else {
						show();
					}
					
				},
				error    : function() {
					alert("Server Error");
					$("#unverified-resend").removeClass("disabled").html("Resend Verification Email");
				}
			});
			
			
		});
	}
	
	function show() {
		$("#unverified-users-table").html("");
		$("#unverified-resend").addClass("disabled");
		$("#unverified-reject").addClass("disabled");
		
		$.ajax({
			url     : "/rest/getUnverifyCeresUsers",
			success : function(resp) {
				if( resp.error ) return alert(resp.message);
				_updateTable(resp);
			},
			error : function() {
				alert("server error");
			}
		});
	}
	
	function _updateTable(data) {
		// create table
		var table = '<table class="table table-hover"><thead>' +
		'<tr><th>User</th><th>Application</th><th>Date Registered</th><th></th></tr></thead><tbody>';
		for( var i = 0; i < data.length; i++ ) {
			var emailError = "";
			if( data[i].emailError ) emailError = " <span style='color:red'>[Email Rejected]</span>";
			
			table += '<tr id="'+data[i]._id+'"><td>'+data[i].username+emailError+'</td><td>'+_getAppName(data[i].app) + 
					 '</td><td>'+_niceDate(data[i].timestamp)+'</td><td><input type="checkbox" /></td></tr>';
		}
		table += "</tbody></table>";
		
		if( data.length == 0 ) table = "No users waiting verification";
		
		$("#unverified-users-table").html(table);
		
		
		
		// add check box handlers
		$("#unverified-users-table input[type='checkbox']").on("click", function(){
			_handleMultiSelect();
		});
	}
	
	function _handleMultiSelect() {
		var rows = $("#unverified-users-table tr");
		var hasSelected = false;
		selectedIds = [];
		
		for( var i = 0; i < rows.length; i++ ) {
			if( $(rows[i]).find("input").is(":checked") ) {
				hasSelected = true;
				selectedIds.push(rows[i].id);
			}
		}
		
		if( hasSelected ) {
			$("#unverified-resend").removeClass("disabled");
			$("#unverified-reject").removeClass("disabled");
		} else {
			$("#unverified-resend").addClass("disabled");
			$("#unverified-reject").addClass("disabled");
		}
	}
	
	function _niceDate(timestamp) {
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