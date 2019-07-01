// jQuery is needed.
// It uses jQuery's Deffered Object to obtain multiple files,
// and assign callbacks when all files are done.
function DFileReader(){
	var fr = new FileReader();
	var dfr = $.Deferred();
	// This is called when all callbacks are executed.
	var reset = function(){
		dfr = $.Deferred();
		fr = new FileReader();
	}
	
	// Read a file and return an Promise Object
	this.readFile = function(fi, fm, cbs_s, cbs_f){
		var file = fi;
		var format = (fm) ? fm : "text";
		var callbacks_suc = (cbs_s && is_array(cbs_s)) ? cbs_s : [];
		var callbacks_fail = (cbs_f && is_array(cbs_f)) ? cbs_f : [];
		
		dfr.done(callbacks_suc);
		dfr.fail(callbacks_fail);
		
		fr.onload = function(e){
			var result = {
				"type": "success",
				"name": file.name,
				"content": e.target.result
			}
			dfr.resolve(result);
			reset();
		};
		
		fr.onerror = function(e){
			var result = {
				"type": "error",
				"name": file.name,
				"content": fr.error	// An DOMError Object ({name, message})
			}
			dfr.reject(result);
			reset();
		};
		
		fr.onabort = function(e){
			var result = {
				"type": "abort",
				"name": file.name,
			}
			dfr.reject(result);
			reset();
		}
		
		switch(fm){
			case "text":
				fr.readAsText(file);
				break;
			default:
				fr.readAsText(file);
				break;
		}
		
		return dfr.promise();	// Return Promise object if user want to add additional callbacks.
	}
	
	// Abort the reading process. And the deferred object will be rejected.
	this.abort = function(){
		fr.abort();
		return;
	}
}


// Allow user to pass Files Object to obtain all file contents.
// Users are recommend to give files of same kind (e.g. plain text) at the same time.
function MultiFileReader(){
	var filter_s = function(){
		var result = [];
		for(var i = 0; i < arguments.length; i++){
			var item = arguments[i];
			result.push({
				"name": item.name,
				"content": item.content
			});
		}
		
		// Question: Are the files sorted by file names here?
		
		return result;
	}
	
	var filter_f = function(args){
		// abort all filereaders, since the master defereed obj is rejected,
		// abortion of other dfreaders won't trigger this function. 
		if(args.type === "error"){
			for(var i = 0; i < dfreaders.length; i++){
				dfreaders[i].abort();
			}
			return {
				"name": args.name,
				"content": args.content
			};
		}
	}
	
	var dfreaders = [];
	var dfpromise = [];
	
	this.readFiles = function(fs, fm, cbs_s, cbs_f){
		var files = fs;
		var format = (fm) ? fm : "text";
		var callbacks_suc = (cbs_s && is_array(cbs_s)) ? cbs_s : [];
		var callbacks_fail = (cbs_f && is_array(cbs_f)) ? cbs_f : [];
		
		dfreaders = []; dfpromise = [];
		
		for(var i = 0; i < fs.length; i++){
			dfreaders.push(new DFileReader());
			dfpromise.push(dfreaders[i].readFile(files[i], format, [], []));
		}
		
		// Not sure if this is safe to set '$' to the context argument...
		return $.when.apply($, dfpromise).then(filter_s, filter_f).done(callbacks_suc).fail(callbacks_fail);
	}
}