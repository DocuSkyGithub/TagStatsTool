$(document).ready(function(e){
	/* Loading spinner settings */
	var spinner = new Spinner({
		lines: 13,
		length: 12,
		width: 7,
		radius: 15,
		scale: 1,
		corners: 1,
		color: '#000',
		opacity: 0.15,
		rotate: 6,
		direction: 1,
		speed: 1,
		trail: 50,
		fps: 20,
		zIndex: 2e9,
		className: 'spinner',
		top: '50%',
		left: '50%',
		shadow: false,
		hwaccel: false,
		position: 'absolute'
	});
	/* Loading Dialog */
	$("div#dialog-loading").dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		draggable: false,
		closeOnEscape: false,
		open: function(){
			if(typeof(window.Worker) === "undefined"){
				$("div#dialog-loading").html('Please wait...<br><p class="note">(Your browser doesn\'t support background process. It is normal if the browser shows "no respond" message.)</p>');
			}
			spinner.spin(document.getElementById("dialog-loading"));
		},
		close: function(){
			spinner.stop();
		}
	});
	$("div#dialog-loading").parent().find("button.ui-dialog-titlebar-close").	// remove close button
		button("destroy").
		remove();
	$("div#dialog-termlist").dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		draggable: true,
		closeOnEscape: true,
		height: 300,
		width: 400
	});
	
	$("div#dialog-analysispreview").dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		draggable: true,
		closeOnEscape: true,
		height: "auto",
		width: "auto"
	});
	
	// TODO
	$("#welcome-start").on("click", function(e){
		$(".sidebar-flag").eq(1).click();
		return;
	});
	$("#corpus-next-termlist").on("click", function(e){
		$(".sidebar-flag").eq(2).click();
		return;
	});
	/*
	$("#corpus-next-analysis").on("click", function(e){
		$(".sidebar-flag").eq(3).click();
		$("#termstat-selectsearchtype-xmltag").click();
		return;
	});
	*/
	$("#termlist-next-analysis").on("click", function(e){
		$(".sidebar-flag").eq(3).click();
		return;
	});
	
	$("#addcorpus-clientfile-textfiles").on("change", TermStat.loadCorpusFiles);
	$("#addtermlist-clientfile-textfiles").on("change", TermStat.loadTermListFiles);
	
	$("#addcorpus-clientfile-submit").on("click", TermStat.newCorpusByFiles);
	$("#addtermlist-clientfile-submit").on("click", TermStat.newTermListByFiles);
	
	// $("#selectall-corpus").on("click", TermStat.selectAllCorpus.bind(TermStat, true));
	// $("#cancelall-corpus").on("click", TermStat.selectAllCorpus.bind(TermStat, false));
	// $("#selectall-termlist").on("click", TermStat.selectAllTermList.bind(TermStat, true));
	// $("#cancelall-termlist").on("click", TermStat.selectAllTermList.bind(TermStat, false));
	
	
	$("#analysis-run-fulltext").on("click", TermStat.runAnalysis.bind(TermStat, "text"));
	$("#analysis-run-xmltag").on("click", TermStat.runAnalysis.bind(TermStat, "xml"));
	$("#outputfile-basicfreq").on("click", TermStat.saveFile.bind(TermStat, "basicfreq", "csv"));
	$("#outputjson-basicfreq").on("click", TermStat.saveFile.bind(TermStat, "basicfreq", "json"));
	$("#uploaddocusky-basicfreq").on("click", TermStat.saveFile.bind(TermStat, "basicfreq", "ds"));
	$("#outputfile-categorizedfile").on("click", TermStat.saveFile.bind(TermStat, "categorizedfile", "csv"));
	$("#outputjson-categorizedfile").on("click", TermStat.saveFile.bind(TermStat, "categorizedfile", "json"));
	$("#uploaddocusky-categorizedfile").on("click", TermStat.saveFile.bind(TermStat, "categorizedfile", "ds"));
	$("#outputfile-categorizedterm").on("click", TermStat.saveFile.bind(TermStat, "categorizedterm", "csv"));
	$("#outputjson-categorizedterm").on("click", TermStat.saveFile.bind(TermStat, "categorizedterm", "json"));
	$("#uploaddocusky-categorizedterm").on("click", TermStat.saveFile.bind(TermStat, "categorizedterm", "ds"));
	
	$("#outputfile-basicfreq-clipboard").on("click", TermStat.saveFile.bind(TermStat, "basicfreq", "csv", {clipboard:1}));
	$("#outputfile-categorizedfile-clipboard").on("click", TermStat.saveFile.bind(TermStat, "categorizedfile", "csv",{clipboard:1}));
	$("#outputfile-categorizedterm-clipboard").on("click", TermStat.saveFile.bind(TermStat, "categorizedterm", "csv",{clipboard:1}));
    $(".window-open-palladio").on("click", TermStat.openPalladio.bind(TermStat));
	
	$("#addtermlist-docusky-getlistinfo").on("click", TermStat.docuSkyTermListCsvGetter);
	
	$(".termstat-analysis-cancel").on("click", function(e){ $("#dialog-analysispreview").dialog("close"); return; });
	
	// $("#searchintags").on("change", TermStat.searchInTags);
	
	/*
	$("button#corpusfile_ok").click(newcorpus);
	$("button#voclistfile_ok").click(newvoclist);
	$("button#vocfile_update").click(getCSVTermList);
	$("button#run").click(run).attr("disabled", true);
	$("button#outputv").click(save_v).attr("disabled", true);
	$("button#outputd").click(save_d).attr("disabled", true);
	*/
	
	/* Side bar flags */
	$(".sidebar-flag").click(function(e){
		/* Close all docusky widgets */
		$(".dsw-container").find(".dsw-btn-close").click();	// 20170214: class of close buttons are different in docwidget and filewidget...
		
		$(".sidebar-flag").removeClass("selected");
		$(e.currentTarget).addClass("selected");
		
		$(".main-screen").removeClass("current");
		$("#" + $(e.currentTarget).attr("value")).addClass("current");
		return;
	});
	$(".flowchart-title").click(function(e){
		/* Close all docusky widgets */
		$(".dsw-container").find(".dsw-btn-close").click();	// 20170214: class of close buttons are different in docwidget and filewidget...
		
		$(".flowchart-title").removeClass("selected");
		$(e.currentTarget).addClass("selected");
		
		$(".main-screen").removeClass("current");
		$("#" + $(e.currentTarget).attr("value")).addClass("current");
		return;
	});	
	$("#termstat-selectsearchtype .tabgroup-navtab").click(function(e){
		$("#termstat-selectsearchtype .tabgroup-navtab").removeClass("selected");
		$(this).addClass("selected");
		
		$("#mainscrn-analysis .tabscreen").removeClass("current");
		switch($(this).attr("id")){
			case "termstat-selectsearchtype-fulltext":
				$("#termstat-preview-searchtype-fulltext").addClass("current");
				break;
			case "termstat-selectsearchtype-xmltag":
				$("#termstat-preview-searchtype-xmltag").addClass("current");
				break;
			default:
				break;
		}
		return;
	});
	
	/* Input control */
	$(".inputfile-info").html("No file chosen");
	$(".inputfile+input[type='file']").change(function(e){
		var infostr = (this.files.length !== 0) ? (this.files.length > 1) ? ((this.files.length) + " Files Selected") : this.files[0].name : "No file selected";
		var fnames = [];
		for(var i = 0, li = this.files.length; i < li; i++){
			fnames.push(this.files[i].name);
		}
		var fnamestr = (this.files.length !== 0) ? fnames.join("\n") : "";
		$(this).siblings(".inputfile-info").attr("title", fnamestr).html(infostr);
	});
	
	$("input[type='radio'][name='csvtype']").change(function(e){
		var type = $(this).val();
		$(".termstat-outputfileoptions").hide();
		switch(type){
			case "basicfreq":
				$(".termstat-outputfileoptions").eq(0).show();
				break;
			case "categorizedfile":
				$(".termstat-outputfileoptions").eq(1).show();
				break;
			case "categorizedterm":
				$(".termstat-outputfileoptions").eq(2).show();
				break;
		}
		return;
	});

	return;
});


window.onload = (function(e){
	/* DocuSky Settings */
	window.docuSkyObj_doc = docuskyGetDbCorpusDocumentsSimpleUI;
	window.docuSkyObj_file = docuskyManageDataFileListSimpleUI;
	$("#addcorpus-docusky-openwidget").click(function(e) {
		var target = 'USER';
		var db = '', corpus = '';
		var page = 1;
		var pageSize = 1;	// we deprecate contents obtained at the first time
		// empty string: force the simpleUI to display a menu for user selection
		
		docuSkyObj_doc.getDbCorpusDocumentsGivenPageAndSize(target, db, corpus, page, pageSize, e, function(){
			// Obtain docuSkyObj_doc's content to know which corpus is requested
			TermStat.docuSkyElasticPageGetter(docuSkyObj_doc.target, docuSkyObj_doc.db, docuSkyObj_doc.corpus, page, 20, e, 10, 10);
		}, "initializing...");
		return;
	});
	$("#addtermlist-docusky-openwidget").click(function(e){
		docuSkyObj_file.manageDataFileList(e, function(){
			$("#addtermlist-docusky-getlistinfo").removeAttr("disabled");
			return;
		});
	});
});