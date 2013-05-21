Ceres.admin.approveUsers = (function(){

	var users = [];
	var selectedIds = [];
	
	function init() {
		$("#approve-reject").on('click',  function(){
			if( $(this).hasClass("disabled") ) return;
			if( !confirm("Are you sure you want to reject these users?") ) return;
			
			$(this).addClass("disabled").html("Rejecting...");
			
			_rejectList();
		});
		
		$("#approve-approve").on('click',  function(){
			if( $(this).hasClass("disabled") ) return;
			if( !confirm("Are you sure you want to approve these users?") ) return;
			
			$(this).addClass("disabled").html("Approving...");
			
			_approveList();
		});
	}
	
	function _rejectList() {
		var error = "";
		var c = selectedIds.length;
		
		function _onRejectComplete() {
			c--;
			if( c == 0 ) {
				$("#approve-reject").removeClass("disabled").html("Reject");
				show();
			}
		}

		for( var i = 0; i < selectedIds.length; i++ ) {
			$.ajax({
				url      : "/rest/rejectUser",
				type     : "POST",
				data     : _getUser(selectedIds[i]),
				success : function(resp) {
					if( resp.error ) alert(resp.message);
					_onRejectComplete();
				},
				error    : function() {
					alert("Server Error");
					_onRejectComplete();
				}
			});
		}
	}
	
	function _approveList() {
		var error = "";
		var c = selectedIds.length;
		
		function _onRejectComplete() {
			c--;
			if( c == 0 ) {
				$("#approve-approve").removeClass("disabled").html("Approve");
				show();
			}
		}

		for( var i = 0; i < selectedIds.length; i++ ) {
			$.ajax({
				url      : "/rest/approveUser",
				type     : "POST",
				data     : _getUser(selectedIds[i]),
				success : function(resp) {
					if( resp.error ) alert(resp.message);
					_onRejectComplete();
				},
				error    : function() {
					alert("Server Error");
					_onRejectComplete();
				}
			});
		}
	}
	
	function _getUser(id) {
		for( var i = 0; i < users.length; i++ ) {
			if( users[i]._id = id ) return users[i];
		}
		return {};
	}
	
	
	function show() {
		$("#approve-users-table").html("");
		$("#approve-approve").addClass("disabled");
		$("#approve-reject").addClass("disabled");
		
		$.ajax({
			url     : "/rest/getWaitingUsers",
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
		'<tr><th>User</th><th>Application</th><th>Authority</th><th>Date Registered</th><th></th></tr></thead><tbody>';
		for( var i = 0; i < data.length; i++ ) {
			table += '<tr id="'+data[i]._id+'"><td>'+data[i].username+'</td><td>'+_getAppName(data[i].app) + 
					 '</td><td>'+data[i].authority+'</td><td>'+_niceDate(data[i].timestamp)+'</td><td><input type="checkbox" /></td></tr>';
		}
		table += "</tbody></table>";
		
		if( data.length == 0 ) table = "No users waiting for approval";
		
		$("#approve-users-table").html(table);
		
		
		// add check box handlers
		$("#approve-users-table input[type='checkbox']").on("click", function(){
			_handleMultiSelect();
		});
	}
	
	function _handleMultiSelect() {
		var rows = $("#approve-users-table tr");
		var hasSelected = false;
		selectedIds = [];
		
		for( var i = 0; i < rows.length; i++ ) {
			if( $(rows[i]).find("input").is(":checked") ) {
				hasSelected = true;
				selectedIds.push(rows[i].id);
			}
		}
		
		if( hasSelected ) {
			$("#approve-approve").removeClass("disabled");
			$("#approve-reject").removeClass("disabled");
		} else {
			$("#approve-approve").addClass("disabled");
			$("#approve-reject").addClass("disabled");
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
