var TermStat = new (function(){
   var synonymMapArray = [];              // 2018-07-04: Tu, 2018-10-30: bug fix (add initialization)

	// Loading modal control
	var startLoading = function(){
		$("#dialog-loading").dialog("open");
		return;
	}
	var stopLoading = function(elps){
		var elapse = (elps && elps >= 0) ? elps : 0;
		setTimeout(function(){
			$("#dialog-loading").dialog("close");
			return;
		}, elapse);
		return;
	}

	// String related
	// 20170726: Remove blanks and newlines
	var tohtmlstr = function(s){
		var str = (s !== undefined && typeof s === "string") ? s : (s === undefined || s === null) ? "" : s.toString();
      //var s = $('<div/>').append(str).text().replace(/[\s\uFEFF\xA0]/g, '');
      var s = $('<div/>').append(str).text().replace(/[\uFEFF\xA0]/g, '');     // 2018-09-07 (Tu): bug fix (should not remove spaces)
		return s;
	}

	// add quotation marks on given string
	var addquo = function(s, q, c){	// 20170412: Add option to fit CSV format requirement
		var str = (s !== undefined && typeof s === "string") ? s : (s === undefined || s === null) ? "" : s.toString();
		var quotemark = (typeof q === "string" && q) ? q : '"';
		var csv = (c === undefined) ? true : (c === true);
		str = (csv) ? str.replace(new RegExp(quotemark, "g"), quotemark + quotemark) : str;	// 20170412

		return quotemark + str + quotemark;
	};

	// 20170726
	var arraddquo = function(arr){
		var i, li;
		var result = [];
		for(i = 0, li = arr.length; i < li; i++){
			result.push(addquo(arr[i]));
		}
		return result;
	}

	// 20170726
	var sheetarrtocsv = function(header, data, param){
		var result = "";
		var linestrs = [];
		var i, li;
		linestrs.push(arraddquo(header).join(","));
		for(i = 0, li = data.length; i < li; i++){
			linestrs.push(arraddquo(data[i]).join(","));
		}
		
		if(typeof(param)=='object' && 'clipboard' in param && param.clipboard==1){
		    csvtoclipboard(linestrs.join("\n"));
		}else{
		    return linestrs.join("\n");
		}
		
	}
    
    var csvtoclipboard = function(data){
       // Create new element
       var el = document.createElement('textarea');
       // Set value (string to be copied)
       el.value = data;
       // Set non-editable to avoid focus and move outside of view
       el.setAttribute('readonly', '');
       el.style = {position: 'absolute', left: '-9999px'};
       document.body.appendChild(el);
       // Select text inside element
       el.select();
       // Copy text to clipboard
       document.execCommand('copy');
       // Remove temporary element
       document.body.removeChild(el);
    }
    
	// TODO: TO CHECK WHICH KIND OF NODES SHOULD BE STRIPPED WHEN DOING TEXT PROCESSING IN XML.
	var xmltagandtextextract = function(s){
		return (typeof s === "string") ? s.replace(/<!(.*?)>|<\?(.*?)\?>/g , "") : "";	// remove comments, doctype declarations, and processing instructions.
	}

	/*
	var simpleIsEqualObject = function(a, b){
		var keys_a = Object.keys(a).sort(), keys_b = Object.keys(b).sort();
		if(keys_a.length === keys_b.length){
			return keys_a.every(function(elem, idx, arr){
				return (elem === keys_b[idx]) && (a[elem] === b[keys_b[idx]]);
			});
		}
		return false;
	}
	*/

	// 20170619: used to filter out HTML tags
	var htmltags = ["!DOCTYPE", "a", "abbr", "acronym", "address", "applet", "area", "article", "aside", "audio", "b", "base", "basefont", "bdi", "bdo", "big", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "command", "datalist", "dd", "del", "details", "dfn", "dir", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption", "figure", "font", "footer", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd", "keygen", "label", "legend", "li", "link", "map", "mark", "menu", "meta", "meter", "nav", "noframes", "noscript", "object", "ol", "optgroup", "option", "output", "p", "param", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "source", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"];

	// 20170619: used to get metadata in docInfo, and map to tool-defined columns
   // 'categorizeddocresult' 會先以每篇文件為單位，計算出該文件內的 tag/term 資訊
	var docuskymetamap_required = [
		["corpus", "Corpus"],
		["docFilename", "Filename"]
	];

	var docuskymeta_required = [
		"Corpus",
		"Filename"
	];

	var docuskymetamap_optional = [
		["db", "Database"],
		["docTitleXml", "Title"],
		["docCompilation", "Compilation"],
		["docClass", "Class"],
		["docCompilationVol", "Compilation_Vol"],
		["docAuthor", "Author"],
		// ["docTopicL1", "topic"],
		// ["geoLevel3", "geo"],
		["docSubclass", "Subclass"],
		["docType", "Type"],
		["docSubtype", "Subtype"],
		["docBookCode", "BookCode"],
		["docSource", "Source"],
      ["timeInfo/dateAdYear", "AdYear"],           // 2017-12-25: Tu
      ["timeInfo/dateAdDate", "AdDate"],           // 2017-12-25
      ["timeInfo/dateOrigStr", "DateOrigStr"],     // 2017-12-25
	];

   var validBasicTermFreqMetadataFields = [
      "Corpus", "Compilation", "Class", "Author", "Type", "Source", "BookCode",
   ];

	// 20170322: (New) Combine all information of taggings
	// 20170619: Change the way of retrieving tags
	var getxmltaggingdata = function(elem){
		var childnodes= [], childnode = {};
		var childtagnames = {};
		var i, li, j, lj, elem_attr, elem_key;
		var attr_tmp = {};
		var textcontent = "";
		// var keystr = "";
		var keyarr = [];
		var result = { "tagnamelist": [], "taggings": {} };


      // Tu: 在此用 depth-first search 取得 xml 中的 tags 資料
		var stack = [elem.childNodes];	// initialize
		while (stack.length !== 0){
			childnodes = stack.pop();
			if(childnodes !== undefined){
				// 1. get node contents  2. push the node into stack
				for(i = 0, li = childnodes.length; i < li; i++){
					childnode = childnodes[i];
               //alert(childnode.nodeName);
					if (childnode.nodeType === 1) {   // 2019-03-01: 即使是 html tag，也應該繼續 traverse 下去（但可不計入統計...）
                  // && htmltags.indexOf(childnode.nodeName) < 0){	// It is an element node, and not an HTML tag.
                  if (htmltags.indexOf(childnode.nodeName) < 0) {
						   attr_tmp = {};
						   // keystr = "";
						   // keyarr = [];

						   textcontent = tohtmlstr(childnode.innerHTML);
						   // keystr = keystr + textcontent + "\t";
						   for(j = 0, lj = childnode.attributes.length; j < lj; j++){
						   	elem_attr = childnode.attributes[j];
						   	attr_tmp[elem_attr.name] = elem_attr.value;
						   	// keyarr.push(elem_attr.name);
						   }

						   // keyarr.sort();
						   // for(j = 0, lj = keyarr.length; j < lj; j++){
						   	// elem_key = keyarr[j];
						   	// keystr = keystr + elem_key + '="' + attr_tmp[elem_key] + '"\t';
						   // }


						   if(!result.taggings[childnode.nodeName]){
						   	result.taggings[childnode.nodeName] = [];
						   }
						   // if(!result.taggings[childnode.nodeName][keystr]){
						   	// result.taggings[childnode.nodeName][keystr] = { "freq": 0, "text": textcontent, "attrs": attr_tmp };
						   // }
						   // result.taggings[childnode.nodeName][keystr].freq += 1;
						   result.taggings[childnode.nodeName].push( { "text": textcontent, "attrs": attr_tmp } );
                  }

                  // add child nodes for later traverse
						if (childnode.hasChildNodes()) stack.push(childnode.childNodes);
					}
				}
			}
		}
		result.tagnamelist = Object.keys(result.taggings).sort();	// sort by character order
		return result;
	}
	/*
		structure: {tagnamelist, taggings(key: tag name, value: an array of all tags)}
	*/

	// Screen update
	var updateCorpus = function(){
		var htmlstr = "";
		var i, li;

		var cnum = savedlist_corpus.length;

		if(savedlist_corpus.length === 0){
			htmlstr = '<tr class="termstat-tr">' +
						'<th class="termstat-th">No saved corpus exist.</th>' +
						'</tr>';
		} else {
         htmlstr = '<tr class="termstat-tr">' +
                   '<th class="termstat-th">ID</th>' +
                   '<th class="termstat-th">Title</th>' +
                   '<th class="termstat-th">#Doc</th>' +
                   '<th class="termstat-th">Del</th>' +
                   '</tr>';
		}

		for(i = 0, li = savedlist_corpus.length; i < li; i++){
			htmlstr = htmlstr +
				'<tr class="termstat-tr">' +
				'<td class="termstat-td centertext">' + (i+1) + '</td>' +
				'<td class="termstat-td">' + savedlist_corpus[i].name + '</td>' +
				'<td class="termstat-td centertext">' + savedlist_corpus[i].num + '</td>' +
				'<td class="termstat-td">' + '<button type="button" class="btn-delete deletecorpus">❌</button>' + '</td>' +
				'</tr>';
		}

		$("#savedcorpuslist").html(htmlstr);
		$(".deletecorpus").each(function(idx, elem){
			$(this).click(function(e){
				savedlist_corpus.splice(idx, 1);
				updateCorpus();
				updatePreview();
				return;
			});
		});

		// $("#counter-corpus").text((cnum > 99) ? "99+" : cnum.toString());

		return;
	};

	var updateTermList = function(){
		var htmlstr = "";
		var i, li;

		var tlnum = savedlist_termlist.length;

		if(tlnum === 0){
			htmlstr = '<tr class="termstat-tr">' +
						'<th class="termstat-th">No saved term list exist.</th>' +
						'</tr>';
		} else {
			htmlstr = '<tr class="termstat-tr">' +
						'<th class="termstat-th">ID</th>' +
						'<th class="termstat-th">Category Name</th>' +
						'<th class="termstat-th">View</th>' +
						'<th class="termstat-th">Del</th>' +
						'</tr>';
		}

		for(i = 0, li = savedlist_termlist.length; i < li; i++){
			htmlstr = htmlstr +
				'<tr class="termstat-tr">' +
				'<td class="termstat-td centertext">' + (i+1) + '</td>' +
				'<td class="termstat-td">' + savedlist_termlist[i].name + '</td>' +
				'<td class="termstat-td">' + '<button type="button" class="btn-view viewtermlist">▶</button>' + '</td>' +
				'<td class="termstat-td">' + '<button type="button" class="btn-delete deletetermlist">❌</button>' + '</td>' +
				'</tr>';
		}

		$("#savedtermlist").html(htmlstr);
		$(".deletetermlist").each(function(idx, elem){
			$(this).click(function(e){
				savedlist_termlist.splice(idx, 1);
				updateTermList();
				updatePreview();
				return;
			});
		});
		$(".viewtermlist").each(function(idx, elem){
			$(this).click(function(e){
				//$("#dialog-termlist").html(savedlist_termlist[idx].contentcsv.replace(/\r\n|\r|\n|,/g, "<br/>"));
				$("#dialog-termlist").html(savedlist_termlist[idx].contentcsv.replace(/\r\n|\r|\n/g, "<br/>"));
				$("#dialog-termlist").dialog("option", "title", "Term List - " + savedlist_termlist[idx].name).dialog("open");
				return;
			});
		});

		// $("#counter-termlist").text((tlnum > 99) ? "99+" : tlnum.toString());

		return;
	};

	var updatePreview = function(){
		var htmlstr = "";
		var xmltaglist = [];
		var i, li, j, lj;
		var tagname = "";

		// Update corpus and term list tables.
		if(savedlist_corpus.length === 0){
			htmlstr = '<tr><th>No corpus exist.</th></tr>';
		} else {
			htmlstr = "<tr><th>Corpora (" + savedlist_corpus.length + ")</th></tr>";
			for(i = 0, li = savedlist_corpus.length; i < li; i++){
				htmlstr = htmlstr + "<tr><td>" +  savedlist_corpus[i].name + "</td></tr>";
				// Update xml info
				if(savedlist_corpus[i].xmltaglist !== undefined){
					xmltaglist = arrmerge(xmltaglist, savedlist_corpus[i].xmltaglist);
				}
			}
		}
		$("#analysispreview-ft-corpuslist").empty().append(htmlstr);
		$("#analysispreview-xt-corpuslist").empty().append(htmlstr);

		htmlstr = "";
		if(savedlist_termlist.length === 0){
			htmlstr = '<tr><th>No term list exist.</th></tr>';
		} else {
			htmlstr = "<tr><th>Term Lists (" + savedlist_termlist.length + ")</th></tr>";
			for(i = 0, li = savedlist_termlist.length; i < li; i++){
				htmlstr = htmlstr + "<tr><td>" +  savedlist_termlist[i].name + "</td></tr>";
			}
		}
		$("#analysispreview-ft-termlist").empty().append(htmlstr);

		// Update xml tags
		if(xmltaglist.length !== 0){
			htmlstr = "<tr><th></th><th>Tag Name</th><th>Filtering Term List</th></tr>"
			for(i = 0, li = xmltaglist.length; i < li; i++){
				tagname = xmltaglist[i];
				htmlstr = htmlstr +
					'<tr>' +
						'<td class="cboxgrid"><div class="cbox">' +
							//'<input type="checkbox" class="termstat-preview-cbox-selecttag" value="' + tagname + '" id="termstat-xmltag-' + tagname + '" checked="true"/>' +
                     '<input type="checkbox" class="termstat-preview-cbox-selecttag" value="' + tagname + '" id="termstat-xmltag-' + tagname + '"/>' +
							'<label for="termstat-xmltag-' + tagname + '"></label>' +
						'</div></td>' +
						'<td>' + tagname + '</td>' +
						'<td class="align-center">' +
							'<select class="termstat-preview-select-filter" name="termstat-xmltag-' + tagname + '-select">' +
							'<option value="none">No Filtering</option>';
				for(j = 0, lj = savedlist_termlist.length; j < lj; j++){
					htmlstr = htmlstr + '<option value="' + j + '">' + savedlist_termlist[j].name + '</option>';
				}
			}
			htmlstr = htmlstr + '</select></td></tr>';
		} else {
			htmlstr = "<tr><th>No XML tag exist in current corpus.</th></tr>";
		}
		$("#analysispreview-xt-taglist").empty().append(htmlstr).find(".termstat-preview-cbox-selecttag").
			each(function(idx, elem){
				$(this).on("change", function(e){
					// Enable or disable select
					$("#analysispreview-xt-taglist .termstat-preview-select-filter").eq(idx).attr("disabled", !$(this).is(":checked"));
					return;
				});
				return;
			});

		//	$("#runanalysis").attr("disabled", (savedlist_corpus.length === 0 || savedlist_termlist.length === 0)); // 20170329
		$("#analysis-run-fulltext").attr("disabled", (savedlist_corpus.length === 0 || savedlist_termlist.length === 0));
		$("#analysis-run-xmltag").attr("disabled", (savedlist_corpus.length === 0));
		return;
	};

	var updateResult = function(type, params){
		var donemsg = "";
		var i, li;
		var elem_header, elem_attrname;
		var htmlstr = "";
		var time = params.time;

		// Metadata output selection
		for(i = 0, li = params.metanamelist_docusky.length; i < li; i++){
			elem_header = params.metanamelist_docusky[i];
			if(docuskymeta_required.indexOf(elem_header) < 0){	// skip required columns
				htmlstr += '<tr>' +
					'<td class="cboxgrid"><div class="cbox">' +
						//'<input type="checkbox" class="outputoptions-cbox-file-metadata-ds" value="' + elem_header + '" id="outputoptions-cbox-file-metadata-ds-' + elem_header + '" checked="true"/>' +
						'<input type="checkbox" class="outputoptions-cbox-file-metadata-ds" value="' + elem_header + '" id="outputoptions-cbox-file-metadata-ds-' + elem_header + '"/>' +
						'<label for="outputoptions-cbox-file-metadata-ds-' + elem_header + '"></label>' +
					'</div></td>' +
					'<td>' + elem_header + '</td>' +
					'</tr>';
			}
		}

		for(i = 0, li = params.metanamelist_userdef.length; i < li; i++){
			elem_header = params.metanamelist_userdef[i];
			htmlstr += '<tr>' +
				'<td class="cboxgrid"><div class="cbox">' +
					//'<input type="checkbox" class="outputoptions-cbox-file-metadata-udef" value="' + elem_header + '" id="outputoptions-cbox-file-metadata-udef-' + elem_header + '" checked="true"/>' +
               '<input type="checkbox" class="outputoptions-cbox-file-metadata-udef" value="' + elem_header + '" id="outputoptions-cbox-file-metadata-udef-' + elem_header + '"/>' +
					'<label for="outputoptions-cbox-file-metadata-udef-' + elem_header + '"></label>' +
				'</div></td>' +
				'<td>' + elem_header + '</td>' +
				'</tr>';
		}

		if(htmlstr === ""){
			htmlstr = "No selectable metadata in the documents."
		}
		$("#output-files-filemetadata table").empty().append(htmlstr);

		htmlstr = "";
		for(i = 0, li = params.metanamelist_docusky.length; i < li; i++){
			elem_header = params.metanamelist_docusky[i];
			if(docuskymeta_required.indexOf(elem_header) < 0){	// skip required columns
				htmlstr += '<tr>' +
					'<td class="cboxgrid"><div class="cbox">' +
						//'<input type="checkbox" class="outputoptions-cbox-term-metadata-ds" value="' + elem_header + '" id="outputoptions-cbox-term-metadata-ds-' + elem_header + '" checked="true"/>' +
                  '<input type="checkbox" class="outputoptions-cbox-term-metadata-ds" value="' + elem_header + '" id="outputoptions-cbox-term-metadata-ds-' + elem_header + '"/>' +
						'<label for="outputoptions-cbox-term-metadata-ds-' + elem_header + '"></label>' +
					'</div></td>' +
					'<td>' + elem_header + '</td>' +
					'</tr>';
			}
		}

		for(i = 0, li = params.metanamelist_userdef.length; i < li; i++){
			elem_header = params.metanamelist_userdef[i];
			htmlstr += '<tr>' +
				'<td class="cboxgrid"><div class="cbox">' +
					//'<input type="checkbox" class="outputoptions-cbox-term-metadata-udef" value="' + elem_header + '" id="outputoptions-cbox-term-metadata-udef-' + elem_header + '" checked="true"/>' +
               '<input type="checkbox" class="outputoptions-cbox-term-metadata-udef" value="' + elem_header + '" id="outputoptions-cbox-term-metadata-udef-' + elem_header + '"/>' +
					'<label for="outputoptions-cbox-term-metadata-udef-' + elem_header + '"></label>' +
				'</div></td>' +
				'<td>' + elem_header + '</td>' +
				'</tr>';
		}
		$("#output-terms-filemetadata table").empty().append(htmlstr);

		switch(type){
			case "fulltext":
				// Clear XML tag attribute selection
				$("#output-terms-xmlattribute table").empty();

				// Update result information
				donemsg = "The calculation of term statistics about terms - (Total Time:" + [time.Hour, time.Minute, time.Second].join(":") + ")：<br/>";
				for(i = 0, li = params.termlists.length; i < li; i++){
					donemsg = donemsg + "<span class='resultinfo-termlist'>" + params.termlists[i].name + "</span><br/>";
				}
				donemsg = donemsg + "in corpora -<br/>";
				for(i = 0, li = params.corpusnames.length; i < li; i++){
					donemsg = donemsg + "<span class='resultinfo-corpus'>" + params.corpusnames[i] + "</span><br/>";
				}
				donemsg = donemsg + "<br/>has completed.";
				$("#termstat-result-info").html(donemsg);

				$("input[type='radio'][name='csvtype']").attr("disabled", false);

				break;
			case "xml":
				// XML tag attribute output selection
				htmlstr = "";
				for(i = 0, li = params.xmlattributelist.length; i < li; i++){
					elem_attrname = params.xmlattributelist[i];
					htmlstr += '<tr>' +
						'<td class="cboxgrid"><div class="cbox">' +
							//'<input type="checkbox" class="outputoptions-cbox-term-xmlattr" value="' + elem_attrname + '" id="outputoptions-cbox-term-xmlattr-' + elem_attrname + '" checked="true"/>' +
                     '<input type="checkbox" class="outputoptions-cbox-term-xmlattr" value="' + elem_attrname + '" id="outputoptions-cbox-term-xmlattr-' + elem_attrname + '"/>' +
							'<label for="outputoptions-cbox-term-xmlattr-' + elem_attrname + '"></label>' +
						'</div></td>' +
						'<td>' + elem_attrname + '</td>' +
						'</tr>';
				}

				$("#output-terms-xmlattribute table").empty().append(htmlstr);

				// Update result information
				donemsg = "The calculation of term statistics about terms in XML tags - (Total Time:" + [time.Hour, time.Minute, time.Second].join(":") + ")：<br/>";
				for(var i = 0, li = params.tagnames.length; i < li; i++){
					donemsg = donemsg + "<span class='resultinfo-termlist'>" + params.tagnames[i] +
						((params.filtermap[params.tagnames[i]]) ? (" (filter by term list: " + params.filtermap[params.tagnames[i]] + ")") : "") +
						"</span><br/>";
				}
				donemsg = donemsg + "in corpora -<br/>";
				for(var i = 0, li = params.corpusnames.length; i < li; i++){
					donemsg = donemsg + "<span class='resultinfo-corpus'>" + params.corpusnames[i] + "</span><br/>";
				}
				donemsg = donemsg + "<br/>has completed.";
				$("#termstat-result-info").html(donemsg);

				$("input[type='radio'][name='csvtype']").attr("disabled", false);
				break;
		}

		// Generate word clouds
		generateWordClouds(params.wordclouddata);

      //alert(JSON.stringify(synonymMapArray));
      //TODO: adding synonymMapArray info. to the computation result...

		// Enable saving buttons
		$("#outputfile-basicfreq").attr("disabled", false);
		$("#outputfile-basicfreq-clipboard").attr("disabled", false);
		$("#outputfile-categorizedfile").attr("disabled", false);
		$("#outputfile-categorizedfile-clipboard").attr("disabled", false);
		$("#outputfile-categorizedterm").attr("disabled", false);
		$("#outputfile-categorizedterm-clipboard").attr("disabled", false);
		$("#outputjson-basicfreq").attr("disabled", false);
		$("#outputjson-categorizedfile").attr("disabled", false);
		$("#outputjson-categorizedterm").attr("disabled", false);
		$("#uploaddocusky-basicfreq").attr("disabled", false);
		$("#uploaddocusky-categorizedfile").attr("disabled", false);
		$("#uploaddocusky-categorizedterm").attr("disabled", false);
		
		$(".window-open-palladio").attr("disabled", false);

		// Switch radio to default (Basic Term Frequencies)
		$("input[type='radio'][name='csvtype']").eq(0).click();
	};

	// DocuSky functions handler
	// 20170424: Add corpus metadata
	// 20170621: Change object structure
	var handler_DocuSkyDocPage = function(){
		var xmlstr = "", textcontent = "";
		var extrametaxml = {};
		var extrametaobj = {};
		var parsedxml = {}, paragraphs = [], contentxml= {};
		var parser = new DOMParser();
		var i, j, li, lj;
      var paragraphAsDoc = true;          // 2018-06-29: if true, regards one paragraph as a document to count df (TODO: setting by argument)

		var elem_docinfo, elem_dsmeta_req, elem_dsmeta_opt, elem_exrameta;
		var tmp_filemeta, tmp_extrameta;
		for(i = 0, li = docuSkyObj_doc.docList.length; i < li; i++){
			elem_docinfo = docuSkyObj_doc.docList[i].docInfo;
			tmp_filemeta = {};
			tmp_extrameta = {};

			// DocuSky-defined metadata
			for(j = 0, lj = docuskymetamap_required.length; j < lj; j++){
				tmp_dsmeta_req = docuskymetamap_required[j];
				if(elem_docinfo[tmp_dsmeta_req[0]] !== undefined){
					tmp_filemeta[tmp_dsmeta_req[1]] = tohtmlstr(elem_docinfo[tmp_dsmeta_req[0]]);
				}
			}
			for(j = 0, lj = docuskymetamap_optional.length; j < lj; j++){
				tmp_dsmeta_opt = docuskymetamap_optional[j];
				//if(elem_docinfo[tmp_dsmeta_opt[0]] !== undefined){
				//	tmp_filemeta[tmp_dsmeta_opt[1]] = tohtmlstr(elem_docinfo[tmp_dsmeta_opt[0]]);
				//}

            // 2017-12-25: (Tu) allows 'timeInfo/dateOrigStr', 'placeInfo/geoLevel1' etc.
            var tagkeys = tmp_dsmeta_opt[0].split('/');
            var pass = true;
            var node = elem_docinfo;
            for (var k=0; k<tagkeys.length; k++) {
               node = node[tagkeys[k]];
               if (node === undefined) {
                  pass = false;
                  break;
               }
            }
            if (pass) tmp_filemeta[tmp_dsmeta_opt[1]] = tohtmlstr(node);
         }
         //alert(JSON.stringify(tmp_filemeta));

			// User-defined metadata (DOMParser will cause error when giving undefined as input)
         //alert(elem_docinfo.docMetadataXml);
			extrametaxml = (elem_docinfo.docMetadataXml !== undefined)
                      ? parser.parseFromString(elem_docinfo.docMetadataXml, "text/xml").children[0]
                      : undefined;
         //alert((new XMLSerializer).serializeToString(( new window.DOMParser() ).parseFromString("<test>xx</test>", "application/xml")));
			if(extrametaxml && extrametaxml.tagName === "DocMetadata"){
				extrametaxml = extrametaxml.children;
				for(j = 0, lj = extrametaxml.length; j < lj; j++){
					elem_exrameta = extrametaxml[j];
					tmp_extrameta[elem_exrameta.tagName] = elem_exrameta.textContent;
				}
				tmp_filemeta["extrameta"] = tmp_extrameta;
            //alert(JSON.stringify(tmp_filemeta["extrameta"]));
			}
         //alert(JSON.stringify(tmp_filemeta));

			// Text content
			xmlstr = elem_docinfo.docContentXml;
			// textcontent = tohtmlstr(xmlstr);

			// Try to parse docContentXml, and split contents in <Passage> if the tag exists.
			// If error happens, only extract text nodes out.
			parsedxml = parser.parseFromString(xmlstr, "text/xml");

			if (parsedxml.getElementsByTagName("parsererror").length === 0) {
            // Note: (2018-06-29 Tu) regards each Paragraph as a separate document in counting df!
            // 20170621: Only get content in <Passage> tags under <Content> tags.
            paragraphs = parsedxml.querySelectorAll("Content>Paragraph");
            if (paragraphs.length !== 0 && paragraphAsDoc) {         // 2018-06-29: add paragraphAsDoc check
               for (j = 0, lj = paragraphs.length; j < lj; j++) {
					   xmltaggingdata = getxmltaggingdata(paragraphs[j]);
                  //alert(JSON.stringify(xmltaggingdata));
						tempdspages_corpus.push({
                     // 20170621: New an empty object, then assing passage_id along with values in tmp_filemeta
                     "metadata": Object.assign({}, tmp_filemeta, {"Passageid": (j + 1).toString()}),
							"xmltext": xmltagandtextextract("<Content>" + paragraphs[j].innerHTML + "</Content>"),
							"text": tohtmlstr(paragraphs[j].innerHTML),
							"xmltaggingdata": xmltaggingdata
						});
					}
				} else {
               // 20170621: Find the first <Content> tag. If not found, use the whole file content
					contentxml = undefined;
					for(j = 0, lj = parsedxml.childNodes.length; j < lj; j++){
						if(parsedxml.childNodes[j].nodeType === 1 && parsedxml.childNodes[j].nodeName === "Content"){
							contentxml = parsedxml.childNodes[j];
							xmltaggingdata = xmltaggingdata = getxmltaggingdata(contentxml);
							break;
						}
					}

					tempdspages_corpus.push({
						"metadata": tmp_filemeta,
						"xmltext": (contentxml !== undefined) ? xmltagandtextextract(parsedxml.outerHTML) : "",
						"text": (contentxml !== undefined) ? tohtmlstr(contentxml.innerHTML) : tohtmlstr(xmlstr),	//20170321 If cannot find <Content> tag, use pure text as content
						"xmltaggingdata": (contentxml !== undefined) ? xmltaggingdata : getxmltaggingdata(parsedxml) // 20170621: add xmltaggingdata
					});
				}
			} else {	   // parse error
            // Basically it won't happen. (XML content saved on DocuSky is well-formed)
				tempdspages_corpus.push({
					"metadata": tmp_filemeta,
					"xmltext": undefined,
					"text": tohtmlstr(xmlstr),	// tohtmlstr() is not used, because xmlstr is not well-formed XML
					"xmltaggingdata": undefined
				});
			}
		}
		return;
	};

	// 20170621: add meta column information
	var handler_DocuSkyDocDone = function(){
		var i, li;
		var taglist = [];
		var metanamelist_docusky = [];
		var metanamelist_userdef = [];

		// Combine XML tag lists in files
		for(i = 0, li = tempdspages_corpus.length; i < li; i++){
			if(tempdspages_corpus[i].xmltaggingdata !== undefined){
				taglist = arrmerge(taglist, tempdspages_corpus[i].xmltaggingdata.tagnamelist);
			}

			metanamelist_docusky = arrmerge(metanamelist_docusky, Object.keys(tempdspages_corpus[i].metadata));
			if(tempdspages_corpus[i].metadata.extrameta){
				metanamelist_userdef = arrmerge(metanamelist_userdef, Object.keys(tempdspages_corpus[i].metadata.extrameta));
			}
         //alert(JSON.stringify(metanamelist_userdef));
		}

		// remove 'extrameta' from metanamelist
		if(metanamelist_docusky.indexOf("extrameta") >= 0){
			metanamelist_docusky.splice(metanamelist_docusky.indexOf("extrameta"), 1);
		}

		savedlist_corpus.push( { "name": docuSkyObj_doc.corpus,
                               "num": tempdspages_corpus.length,
                               "docs": tempdspages_corpus,
                               "xmltaglist": taglist,
                               "metanamelist_docusky": metanamelist_docusky,
                               "metanamelist_userdef": metanamelist_userdef } );
		tempdspages_corpus = [];
		updateCorpus();
		updatePreview();

		// console.log(savedlist_corpus);
		return;
	};

	var docuSkyDocPageIterator = function(tgt, db, cps, cp, ps, pt, evt, minps, maxelps, tcb, pcb, flag){
		var timetag = new Date().getTime();
		var elapse = (timetag - pt) / 1000;
		var currentpage = cp;
		var nextpage = 0;
		var psize = ps;
		var minsize = (Number.isInteger(minps) && minps > 0) ? minps : 10;
		var maxelapse = (maxelps > 2) ? maxelps : 2; // seconds
		var maxpage = Math.ceil(docuSkyObj_doc.totalFound / psize);
		// The number may be wrong when retrieving the last page, but under this situation it will not be used.
		var pageobtained = psize * currentpage;
		var totalcallback = (typeof tcb === "function") ? tcb : function(){return;};
		var pagecallback = (typeof pcb === "function") ? pcb : function(){return;};

		// Handle obtained page
		pagecallback();

		if(currentpage === maxpage || maxpage === 0){	// (maxpage === 0) : in case user choosing an empty corpus
			// The whole corpus is obtained
			totalcallback();
		} else {
			// If current time is less than maxelapse, check if we can double the magnitude
			if(elapse <= maxelapse){
				if(pageobtained % (psize * 2) === 0){
					psize = psize * 2;
               if (psize > 160) psize = 160;           // 2018-06-02 (Tu): set upperbound pagesize to 160
					nextpage = (pageobtained / psize) + 1;
				} else {
					nextpage = currentpage + 1;
				}
			} else if (elapse <= maxelapse * 1.25){ // Else, if current time is less than (1.25 * maxelapse), maintain current magnitude
				nextpage = currentpage + 1;
			} else { // If current time is more than 1.25 * maxelapse, try lower the magnitude to half
				if(psize > minsize && psize % minsize === 0){
					psize = psize / 2;
					nextpage = (pageobtained / psize) + 1;
				} else {
					nextpage = currentpage + 1;
				}
			}
			timetag = new Date().getTime();
			docuSkyObj_doc.getDbCorpusDocumentsGivenPageAndSize(tgt, db, cps, nextpage, psize, evt, function(){
				docuSkyDocPageIterator(tgt, db, cps, nextpage, psize, timetag, evt, minsize, maxelapse, totalcallback, pagecallback);
			}, (pageobtained + "/" + docuSkyObj_doc.totalFound));
		}
		return;
	};

   // Tu: the followings are not global variables, but variables within TermStat
	var tempfile_corpus = [];
	var tempfile_termlist = [];
	var tempdspages_corpus = [];
	var savedlist_corpus = [];
	var savedlist_termlist = [];
	var result = {};
	var timetag = "";

	this.loadCorpusFiles = function(callback) {
		tempfile_corpus = [];
		var files = document.getElementById("addcorpus-clientfile-textfiles").files;
		var mtr = new MultiFileReader();
		var i, li;
		var fl, fd;

		if(files.length === 0){
			return;
		}
		for(i = 0, li = files.length; i < li; i++){
			fl = files[i];
			if(!fl.type || fl.type !== "text/plain") {         // excluding text/csv, text/html, ... ??
				alert('File "' + fl.name + '" is not pure text file. Please make sure all selected files are in pure text format.');
				$("#addcorpus-clientfile-textfiles").val("").trigger("change");
				return;
			}
		}

		startLoading();

		// 20170621: XML content (MultiFileReader)
		mtr.readFiles(files, "text",
			[function(data){        // data: [ {name, content}, {name, content}, ... ]
				var i, li, j, lj;
				var tmp_metadata = {};
				var filestr = "", parsedxml;
				var paragraphs, xmltaggingdata, contentxml;
				var parser = new DOMParser();
				//alert(JSON.stringify(data));
				for(i = 0, li = data.length; i < li; i++){
					var fd = data[i];
					tmp_metadata = {
						"Filename": fd.name,     // 2018-03-25: 原先是 filename，但似乎應是 Filename
						"Corpus": "default",	    // 2018-03-25: 應該是 "Corpus" 而非 "corpus" (corpus name will be added when user start adding the files to corpus list.)
						"order": (i + 1).toString()
					};

					filestr = fd.content;
					parsedxml = parser.parseFromString(filestr, "text/xml");

					if( parsedxml.getElementsByTagName("parsererror").length === 0 ){
						paragraphs = parsedxml.querySelectorAll("Content>Paragraph");
						if(paragraphs.length !== 0){
							for(j = 0, lj = paragraphs.length; j < lj; j++){
								xmltaggingdata = getxmltaggingdata(paragraphs[j]);
								tempfile_corpus.push({
									"metadata": Object.assign({}, tmp_metadata, {"Passageid": (j + 1).toString()}),
									"xmltext": xmltagandtextextract("<Content>" +  paragraphs[j].innerHTML + "</Content>"),
									"text": tohtmlstr(paragraphs[j].innerHTML),
									"xmltaggingdata": xmltaggingdata
								});
							}
						} else {
							contentxml = undefined;
							for(j = 0, lj = parsedxml.childNodes.length; j < lj; j++){
								if(parsedxml.childNodes[j].nodeType === 1 && parsedxml.childNodes[j].nodeName === "Content"){
									contentxml = parsedxml.childNodes[j];
									xmltaggingdata = xmltaggingdata = getxmltaggingdata(contentxml);
									break;
								}
							}
							tempfile_corpus.push({
								"metadata": tmp_metadata,
								"xmltext": (contentxml !== undefined) ? xmltagandtextextract(parsedxml.outerHTML) : "",
								"text": (contentxml !== undefined) ? tohtmlstr(contentxml.innerHTML) : tohtmlstr(filestr),	//20170321 If cannot find <Content> tag, use pure text as content
								"xmltaggingdata": (contentxml !== undefined) ? xmltaggingdata : getxmltaggingdata(parsedxml) // 20170621: add xmltaggingdata
							});
						}
					} else {
						tempfile_corpus.push({
							"metadata": tmp_metadata,
							"xmltext": undefined,
							"text": tohtmlstr(filestr),
							"xmltaggingdata": undefined
						});
					}
				}
				stopLoading(400);
            //alert(JSON.stringify(tempfile_corpus));

            if (typeof(callback) === 'function') callback();          // 2018-04-03
				return;
			}],
			[function(data){
				stopLoading(400);
				alert('Error happens when reading file "' + data.name + '".\nError: ' + data.content.name + "\nMessage: " + data.content.message);
				return;
			}]
		);
		return;
	};

	// 20170622: add meta column information and xml tag information
	this.newCorpusByFiles = function(){
		var name = $("#addcorpus-clientfile-corpusname").val().trim();
		var i, li;
		var taglist = [];

		if(!name.length){	// empty string
			alert("Please enter in corpus name.");
			return;
		}
		if(tempfile_corpus.length === 0){
			alert("Have not select any file for corpus document. Please select at least one file in pure text format.");
			return;
		}

		startLoading();
		for(i = 0, li = tempfile_corpus.length; i < li; i++){
			tempfile_corpus[i].metadata.Corpus = name;	// 2018-03-25: Tu fix (should be metadata.Corpus, not .corpus)

			if(tempfile_corpus[i].xmltaggingdata !== undefined){
				taglist = arrmerge(taglist, tempfile_corpus[i].xmltaggingdata.tagnamelist);
			}
		}

		// TODO: 'order' is not DS-defined...
		savedlist_corpus.push({ "name": name, "num": tempfile_corpus.length, "docs": tempfile_corpus, "xmltaglist": taglist, "metanamelist_docusky": ["corpus", "filename", "order"], "metanamelist_userdef": [] });
		$("#addcorpus-clientfile-corpusname").val("");
		$("#addcorpus-clientfile-textfiles").val("").trigger("change");
		tempfile_corpus = [];
		updateCorpus();
		updatePreview();
		stopLoading(400);

		return;
	};

	this.loadTermListFiles = function(callback) {
		tempfile_termlist = [];
		var files = document.getElementById("addtermlist-clientfile-textfiles").files;
		var mfr = new MultiFileReader();
		var subidx;
		var i, li;
		var fd;
		var cname = "";

		if(files.length === 0){
			return;
		}

		startLoading();
		mfr.readFiles(files, "text",
			[function(data){
				for(i = 0, li = data.length; i < li; i++){
					var fd = data[i];
					subidx = fd.name.search(/\.[^\.]+$/g);	// 20170731: remove "u" flag (for older browsers)
					// TODO: Error message when can't get filename ?
					cname = fd.name.substring(0, (subidx > 0) ? subidx : undefined);
					tempfile_termlist.push({"name": cname, "contentcsv": fd.content});
				}
				stopLoading(400);
            if (typeof(callback) === 'function') callback();          // 2018-04-03
				return;
			}],
			[function(data){
				stopLoading(400);
				alert('Error happens when reading file"' + data.name + '".\nError: ' + data.content.name + "\nMessage: " + data.content.message);
				return;
			}]
		);
		return;
	};

	this.newTermListByFiles = function(){
		var files = tempfile_termlist;
		if(files.length === 0){
			alert("Have not select any file. Please select at least one file in pure text format.");
			return;
		}

		savedlist_termlist = savedlist_termlist.concat(tempfile_termlist);
		$("#addtermlist-clientfile-textfiles").val("").trigger("change");
		updateTermList();
		updatePreview();
		stopLoading(400);
		return;
	};


	this.docuSkyElasticPageGetter = function(tgt, db, cps, cp, ps, evt, minps, maxelps){
		var time = new Date().getTime();
		docuSkyObj_doc.getDbCorpusDocumentsGivenPageAndSize(tgt, db, cps, cp, ps, evt, function(){
			docuSkyDocPageIterator(tgt, db, cps, cp, ps, time, evt, minps, maxelps, handler_DocuSkyDocDone, handler_DocuSkyDocPage);
		}, "0/" + docuSkyObj_doc.totalFound);
		return;
	};

	this.docuSkyTermListCsvGetter = function(){
		var dsflist = docuSkyObj_file.categoryFilenameList;
		var dscategory = "DocuTools";
		var path = "TermStat/TermList/";
		var termlistcategories = {};
		var i, li;
		var fullpath = "", pathnames = [], catname = "", filename = "";
		var keys = [];
		var htmlstr = "", catname = "", catfiles = [];

		for(i = 0, li = dsflist[dscategory].length; i < li; i++){
			fullpath = dsflist[dscategory][i];

			// only allow format in: "(category name)/(json filename)"
			// 20170808: solve problem when (1) has not match
			pathnames = fullpath.match(path + "(.*)");
			pathnames = (pathnames !== null && pathnames.length === 2) ? pathnames[1].split("/") : [];

			if(pathnames.length === 2 && pathnames.every(function(i){return i;})){	// Notice: every() is not supported before IE9.
				catname = pathnames[0];
				filename = pathnames[1];
				if(!termlistcategories[catname]){
					termlistcategories[catname] = [];
				}
				termlistcategories[catname].push(filename);
			}
		}
		keys = Object.keys(termlistcategories);

		if(keys.length === 0){
			htmlstr = '<tr class="termstat-tr">' +
						 '<th class="termstat-th">No saved term list exist.</th>' +
					    '</tr>';
		} else {
         htmlstr = '<tr class="termstat-tr">' +
                   '<th class="termstat-th">ID</th>' +
                   '<th class="termstat-th">Group Name</th>' +
                   '<th class="termstat-th">#List</th>' +
                   '<th class="termstat-th">Add</th>' +
                   '</tr>';
		}

		for(i = 0, li = keys.length; i < li; i++){
			catname = keys[i];
			catfiles = termlistcategories[catname];
			htmlstr = htmlstr +
						'<tr class="termstat-tr">' +
							'<td class="termstat-td centertext">' + (i + 1) + '</td>' +
							'<td class="termstat-td">' + catname + '</td>' +
							'<td class="termstat-td centertext">' + catfiles.length + '</td>' +
							'<td class="termstat-td">' + '<button type="button" class="btn-add addtermlist-docusky-addtl">➕</button>' + '</td>' +
						'</tr>';
		}
		$("#addtermlist-docusky-tltable").empty().append(htmlstr);
		$(".addtermlist-docusky-addtl").each(function(idx){
			$(this).click(function(e){
				startLoading();
				// Need to be checked again...
				var catname = keys[idx];
				var filenames = termlistcategories[catname];
				var c = dscategory;
				var p = path + catname;
				var data = [];
				var i, li, item;

				var cb_s = function(data){
					for(i = 0, li = data.files.length; i < li; i++){
						item = data.files[i].content;
						savedlist_termlist.push({"name": item.name, "contentcsv": item.csv});
					}
					updateTermList();
					updatePreview();
					stopLoading(400);
					return;
				}
				var cb_f = function(data){
					alert("Error Code: " + data.code + "\nMessage:" + data.message);
					stopLoading(400);
					return;
				}

				for(i = 0, li = filenames.length; i < li; i++){
					data.push({
						"category": c,
						"datapath": p,
						"filename": filenames[i]
					});
				}
				DSMultiFileRetrieve(docuSkyObj_file, data, [cb_s], [cb_f]);
			});
		});
		return;
	}


	this.runAnalysis = function(type) {
		var params = {}, docs = [], termlists = [], corpusnames = [], meta_ds = [], meta_user = [];
		var selected_tagnames = [], filterlistmap = {}, filterlist = {};
		var selectedtagname = "", filterlistid = "", selectedtermlist = {};
		var i, li;
		var filtergroup = $("#analysispreview-xt-taglist .termstat-preview-select-filter");

		switch(type) {
			case "text":
            //var extraField = "Corpus";
            var extraField = $("#selectMetadataFieldForBasicFreq").find(":selected").val();
            var extraFieldCntType = "tf";
            var extraFieldVals = [];

				for(i = 0, li = savedlist_corpus.length; i < li; i++){
					meta_ds = arrmerge(meta_ds, savedlist_corpus[i].metanamelist_docusky);
					meta_user = arrmerge(meta_user, savedlist_corpus[i].metanamelist_userdef);
					docs = docs.concat(savedlist_corpus[i].docs);
					corpusnames.push(savedlist_corpus[i].name);
				}
				for(i = 0, li = savedlist_termlist.length; i < li; i++){
					termlists.push(savedlist_termlist[i]);
				}

            // 2018-04-07 (Tu): 計算 extra 參數...
            docs.forEach(function(d) {
               var v = d.metadata[extraField];
               extraFieldVals.push(v);
            });
            extraFieldVals = Array.from(new Set(extraFieldVals))
            //alert(JSON.stringify(extraFieldVals));

            // 用 worker 在背景進行計算
				runAnalysis_FullText({
					"type": "fulltext",
					"docs": docs,
					"termlists": termlists,
					"corpusnames": corpusnames,
					"metanamelist_docusky": meta_ds,
					"metanamelist_userdef": meta_user,
               "extra": { field: extraField,
                          fieldVals: extraFieldVals,
                          countType: extraFieldCntType}          // 2018-04-07
				});
				break;
			case "xml":
				for(i = 0, li = savedlist_corpus.length; i < li; i++){
					meta_ds = arrmerge(meta_ds, savedlist_corpus[i].metanamelist_docusky);
					meta_user = arrmerge(meta_user, savedlist_corpus[i].metanamelist_userdef);
					docs = docs.concat(savedlist_corpus[i].docs);
					corpusnames.push(savedlist_corpus[i].name);
				}
				$("#analysispreview-xt-taglist").
					find(".termstat-preview-cbox-selecttag").each(function(idx, elem){
						if($(this).is(":checked")){
							selectedtagname = $(this).val();
							selected_tagnames.push(selectedtagname);
							filterlistid = filtergroup.eq(idx).children("option").filter(":selected").val();
							if(filterlistid !== "none"){
								selectedtermlist = savedlist_termlist[parseInt(filterlistid)];
								filterlistmap[selectedtagname] = selectedtermlist.name;
								filterlist[selectedtermlist.name] = selectedtermlist.contentcsv;
							} else {
								filterlistmap[selectedtagname] = undefined;
							}
						}
						return;
					});
				runAnalysis_XmlTag({
					"type": "xmltag",
					"docs": docs,
					"xmltagginginfo": { "tagnames": selected_tagnames, "filtermap": filterlistmap, "filterlist": filterlist },
					"corpusnames": corpusnames,
					"metanamelist_docusky": meta_ds,
					"metanamelist_userdef": meta_user
				});
				break;
			default:
				break;
		}
		return;
	}

	var runAnalysis_FullText = function(params){
		var myworker = new Worker("./js/worker_search.js");
		var timer = new Stopwatch(), elapseID = 0;

		$("#processbar-ratio").css("width", "0%");
		$("#processbar").show();
		startLoading();

		timer.start();
		elapseID = setInterval(function(){
			var t = timer.getTime(3);
			$("#dialog-loading").dialog("option", "title", "In progress... (" + [t.Hour, t.Minute, t.Second].join(":") + ")");
			return;
		}, 200);

		myworker.addEventListener("message", function(e){
			var c = JSON.parse(e.data);
			var t = {};
			var donemsg = "";
			var htmlstr = "";
			var i, li;
			var elem_header = "";

			if(c.msgtype === 0) {
				$("#loadingmessage").text(c.msg);
				$("div.processbar-ratio").css("width", Number.parseInt(c.process * 250));
			} else if(c.msgtype === 1) {         // finish worker computation
				myworker.terminate();
				result = c.result;                // copy worker result (the computation result ready for outputs)
            synonymMapArray = c.synonymMapArray || [];        // 2018-07-04, 2019-04-11 add || []
            //alert(JSON.stringify(synonymMapArray));
				timetag = c.timetag;
				clearInterval(elapseID);
				t = timer.stop(3);

				$("#dialog-loading").dialog("option", "title", "Please wait...");

				updateResult("fulltext", {
					"termlists": params.termlists,
					"corpusnames": params.corpusnames,
					"metanamelist_docusky": params.metanamelist_docusky,
					"metanamelist_userdef": params.metanamelist_userdef,
					"wordclouddata": result.wordclouddata,
					"time": t
				});

				$(".sidebar-flag").eq(4).click();	// turn to result section
				stopLoading(0);
				$("#processbar").hide();
				$("#outputfile-byterm").removeAttr("disabled");
				$("#outputfile-byfile").removeAttr("disabled");
				$("#outputfile-xmldetail").attr("disabled", true);
			}
			return;
		});
      // params:= {type:'fulltext',
      //           docs: [{metadata:{Corpus,Filename,Title,Compilation,X,Y,Z...}, xmltext:"", text:string}, ...],
      //           termlists:[...],
		//           termToPrimayMap:{term1:main1, term2:main2, ...},      // TODO: not implemented yet...
      //           corpusnames:[...],
      //           metanamelist_docusky: ...,
      //           metanamelist_userdef: ...,
      //           extra: {field, fieldVals, countType}
      //          }
      // Note: for metadata/X, metadata/Y, metadata/Z, only X, Y, Z will be kept
      //alert(JSON.stringify(params));
      //alert(JSON.stringify(params.corpusnames));
      //alert(JSON.stringify(params.docs[0]));
		myworker.postMessage(params);
		return;
	};

	var runAnalysis_XmlTag = function(params){
		var myworker = new Worker("./js/worker_search.js");
		var timer = new Stopwatch(), elapseID = 0;

		$("#processbar-ratio").css("width", "0%");
		$("#processbar").show();
		startLoading();

		timer.start();
		elapseID = setInterval(function(){
			var t = timer.getTime(3);
			$("#dialog-loading").dialog("option", "title", "In progress... (" + [t.Hour, t.Minute, t.Second].join(":") + ")");
			return;
		}, 200);

		myworker.addEventListener("message", function(e){
			var c = JSON.parse(e.data);
			var t = {};
			var donemsg = "";

			if(c.msgtype === 0){
				$("#loadingmessage").text(c.msg);
			$("div.processbar-ratio").css("width", Number.parseInt(c.process * 250));
			} else if(c.msgtype === 1){
				myworker.terminate();
				result = c.result;
				timetag = c.timetag;
				clearInterval(elapseID);
				t = timer.stop(3);
				$("#dialog-loading").dialog("option", "title","Please wait...");

				updateResult("xml", {
					"tagnames": params.xmltagginginfo.tagnames,
					"filtermap": params.xmltagginginfo.filtermap,
					"corpusnames": params.corpusnames,
					"metanamelist_docusky": params.metanamelist_docusky,
					"metanamelist_userdef": params.metanamelist_userdef,
					"xmlattributelist": result.xmlattributelist,
					"wordclouddata": result.wordclouddata,
					"time": t
				});

            //alert(JSON.stringify(params.xmltagginginfo));
            //alert(JSON.stringify(params.docs));
				// generateWordClouds(result.wordclouddata);

				$(".sidebar-flag").eq(4).click();
				stopLoading(0);
				$("#processbar").hide();
				$("#outputfile-byterm").removeAttr("disabled");
				$("#outputfile-byfile").removeAttr("disabled");
				$("#outputfile-xmldetail").removeAttr("disabled");
			}
			return;
		});

      // params:= {type:'fulltext',
      //           docs: [{metadata:{Corpus,Filename,Title,Compilation,X,Y,Z...}, xmltext:"", text:string}, ...],
      //           termlists:[...],
		//           termToPrimayMap:{term1:main1, term2:main2, ...},      // TODO: not implemented yet...
      //           corpusnames:[...],
      //           metanamelist_docusky: ...,
      //           metanamelist_userdef: ...,
      //           extra: {field, fieldVals, countType}
      //          }
      //alert(JSON.stringify(params.docs[0].xmltaggingdata));
		myworker.postMessage(params);
		return;
	};

   // 2018-07-12
   var sortArrayByElementField = function(field, order) {
      // e.g., myArray = [ { field, dummy, ...}, {field, dummy, ...}, ...]
      //       myArray.sort(sortArrayByElementField('field','desc'));
      return function(a,b) {
         if (order === 'desc') return (a[field] < b[field]) - (a[field] > b[field]);
         else return (a[field] > b[field]) - (a[field] < b[field]);
      }
   }

	var generateWordClouds = function(data){
		var corpusname = "";
		var canvas = $("#termstat-wordcloud");

		canvas.find(".termstat-wordcloud-canvas").each(function(idx, elem){
			$(this).jQCloud("destroy");
		});
		canvas.empty();

		for(corpusname in data){
			if(data[corpusname] !== undefined && data[corpusname].length !== 0){
				canvas.append("<div class='termstat-wordcloud-block'><div class='termstat-wordcloud-title'>" + corpusname + "<button class='btn btn-normal termstat-wordcloud-saveimg' disabled='disabled'>Wait for render...</button></div><div class='termstat-wordcloud-canvas'></div></div>");
				canvas.find(".termstat-wordcloud-canvas").last().jQCloud(data[corpusname], {
					"fontSize": {"from": 0.15, "to": 0.0225},
					"autoResize": true,
					"delay": 10,
					"afterCloudRender": function(){
						var renderedelem = this;
						var wcblock = $(this).parent();
						wcblock.find(".termstat-wordcloud-saveimg").click(function(e){
							html2canvas(renderedelem, {
								"onrendered": function(renderedimg){
									renderedimg.toBlob(function(blob){
										saveAs(blob, corpusname + ".png");
										return;
									}, "image/png");
									return;
								}
							});
							return;
						}).text("Save as PNG").attr("disabled", false);
					}
				});
			} else {
				canvas.append("<div class='termlist-wordcloud-block'><div class='termstat-wordcloud-title'>No searched term in corpus 「" + corpusname + "」.</div><div class='termstat-wordcloud-canvas'> </div></div>");
			}
		}
		/*
		canvas.find(".termstat-wordcloud-saveimg").each(function(idx, elem){
			$(this).click(function(e){
				html2canvas(canvas.find(".termstat-wordcloud-canvas")[idx], {
					"onrendered": function(canvas){

					}
				})
			});
		});
		*/
	}

   // 2018-04-09: Tu
   this.refreshMetadataFieldOptions = function() {
      // 僅檢視第一個 corpus 的第一篇文件，並取出其 metadata 欄位
      if (savedlist_corpus.length == 0) return;
      var firstCorpus = savedlist_corpus[0];
      if (firstCorpus.docs.length == 0) return;
      var firstDoc = firstCorpus.docs[0];
      var oldOptions = [], curOptions = [];
      // 目前並沒有檢測是否有異動，是否需保持 selected option（目前是每次都重設）
      $("#selectMetadataFieldForBasicFreq option").each(function() {
         oldOptions.push($(this).val());
      });
      //alert("=>" + JSON.stringify(oldOptions));
      for (var key in firstDoc.metadata) {
         if (validBasicTermFreqMetadataFields.indexOf(key) >= 0) {
            curOptions.push(key);
         }
      }

      var union = [...new Set([...oldOptions, ...curOptions])];     // compute array union
      if (oldOptions.length !== curOptions.length || curOptions.length !== union.length) {
         // reset options
         var options = "";
         var n = 0;
         curOptions.forEach(function(val) {
            var selected = (++n == 1) ? " selected='selected'" : "";
            options += "<option value='" + val + "'" + selected + ">" + val + "</option>\n";
         });
         $("#selectMetadataFieldForBasicFreq").html(options);
      }
      //alert(options);
   };
    
    this.openPalladio = function(){
        window.open("https://hdlab.stanford.edu/palladio-app/#/upload");
    };

	this.saveFile = function(type, format, param) {
      //alert(type + ':' + format);
		// 20170719 TODO:
		// For basicfreq, only push out all results
		// For file, collect metadata, then push out all results
		// For Term, (1) full text: collect metadata, extend result from result_file
		// (2) xml tags: collect metadata and attrs, merge results based on text and attr

		// 20170726 TODO:
		// From JSON arr to CSV:
		// (1) Form header array
		// (2) Form data array
		// (3) Apply addquo() to each array, join with ','
		// (4) Join all lines with newline

      // 2018-07-04: Tu (TODO) -- adjust results by synonymMapArray
      // synonymMapArray: [ { "name":category_name, "terms":term_list, "termToPrimaryMap":termToPrimaryMap, "termToPrimaryActivated":true/false}, ...]
      //alert(JSON.stringify(synonymMapArray[0].termToPrimaryActivated));
      var synonymEnabled = false;
      synonymMapArray.forEach(function(element) {
         if (element.termToPrimaryActivated === true) synonymEnabled = true;
      });

		var outputtype = type;
		var outputformat = format;
		var analysistype = result.type;
		var resultarr = [];
		var i, li, j, lj, k, lk, p, lp;
		var elem_data;
		var filenameheader = "";

		var selectedmetadata_ds = [];
		var selectedmetadata_udef = [];
		var selectedxmlattr = [];
		var elem_categoryresult, elem_fileresult, elem_termresult;

		var csvheaders = [];
		var tmp_datarow = [];
		var outputdatalist = [];

		switch(outputtype){
			case "basicfreq":
            // output row: Category, Term, (Optional Primary), TF, DF, ExtraField_1, ..., ExtraField_NonZeroCount
				filenameheader = "Result_BasicFrequencies_";
				csvheaders = (synonymEnabled)                             // 2018-07-05
                       ? ["Category", "Term", "Primary", "TF", "DF"]
                       : ["Category", "Term", "TF", "DF"];

            // 2018-04-07: add extraFields (values under user-specified metadata field)
            //alert(JSON.stringify(result.basicfrequencyresult));    // e.g., {"category":"synonym_test_藥名","term":"川谷","tf":27,"df":27,"extraFields":{"本草經集注-0331":27}}, ...}
            if (result.basicfrequencyresult.length == 0) break;
            var firstTermResult = result.basicfrequencyresult[0];
            var extraFields = firstTermResult.extraFields;
            if (extraFields) {
               for (var key in extraFields) csvheaders.push(key);
               csvheaders.push("ExtraField_NonZeroCount");      // 2018-07-01: for these "extra fields", how many columns have non-zero values
            }

				for(i = 0, li = result.basicfrequencyresult.length; i < li; i++){
					elem_data = result.basicfrequencyresult[i];
               var termToPrimaryMap = {};                       // 2018-07-05: get the map for the current category
               if (synonymEnabled) {
                  var recordCategory = elem_data.category;
                  synonymMapArray.forEach(function(element) {
                     if (element.name === recordCategory) {
                        termToPrimaryMap = element.termToPrimaryMap;
                        return;
                     }
                  });
               }
               var termPrimary = termToPrimaryMap[elem_data.term];
               var termPrimaryArr = (termPrimary) ? [termPrimary] : [];
               var termResult = [elem_data.category, elem_data.term].concat(termPrimaryArr).concat([elem_data.tf, elem_data.df]);
               if (extraFields) {
                  var nonzeroCount = 0;
                  for (var key in extraFields) {
                     var tf = elem_data.extraFields[key];
                     if (tf > 0) nonzeroCount++;            // 2018-07-01
                     termResult.push(tf);
                  }
                  termResult.push(nonzeroCount);            // 2018-07-01
               }
					outputdatalist.push(termResult);
				}
				break;
			case "categorizedfile":
            // output row: Category, Corpus, Filename, (Optional Metadata), TermsCount, TotalOccurrence, TermList, Details
            // TODO: add "synonym" info to the TermList an Details...
				filenameheader = "Result_CategorizedFileResult_";
				csvheaders = ["Category"];

				for(i = 0, li = docuskymetamap_required.length; i < li; i++){
					csvheaders.push(docuskymetamap_required[i][1]);
				}

				$("#output-files-filemetadata .outputoptions-cbox-file-metadata-ds:checked").each(
					function(elem, idx){
						selectedmetadata_ds.push($(this).val());
						csvheaders.push($(this).val());
						return;
					}
				);

				$("#output-files-filemetadata .outputoptions-cbox-file-metadata-udef:checked").each(
					function(elem, idx){
						selectedmetadata_udef.push($(this).val());
						csvheaders.push($(this).val());
						return;
					}
				);
				csvheaders = csvheaders.concat(["TermsCount", "TotalOccur", "TermList", "Detail"]);

				for(i = 0, li = result.categorizeddocumentresult.length; i < li; i++){
					elem_categoryresult = result.categorizeddocumentresult[i];      // { category-name, document-list:[doc,...] }, each doc = { metadata, termscount, totaloccur, termlist, termfreqlist, detail}
					for(j = 0, lj = elem_categoryresult["document-list"].length; j < lj; j++){
						elem_fileresult = elem_categoryresult["document-list"][j];
						tmp_datarow = [];

                  var recordCategory = elem_categoryresult["category-name"];
						tmp_datarow.push(recordCategory);

                  var termToPrimaryMap = {};              // 2018-07-11: needs to get the map for the current category
                  if (synonymEnabled) {
                     synonymMapArray.forEach(function(element) {
                        if (element.name === recordCategory) {
                           termToPrimaryMap = element.termToPrimaryMap;     // update to this map (note: not a full copy but a simple reference assignment)
                           return;
                        }
                     });
                  }

						for(k = 0, lk = docuskymetamap_required.length; k < lk; k++){
							tmp_datarow.push(elem_fileresult.metadata[docuskymetamap_required[k][1]]);
						}
						for(k = 0, lk = selectedmetadata_ds.length; k < lk; k++){
							tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_ds[k]]);
						}
						for(k = 0, lk = selectedmetadata_udef.length; k < lk; k++){
                     //alert(JSON.stringify(selectedmetadata_udef));
                     //alert(JSON.stringify(elem_fileresult.metadata));
							//tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_udef[k]]);
							//tmp_datarow.push(elem_fileresult.metadata.extrameta[selectedmetadata_udef[k]]);     // 2018-06-02
                     // 2018-11-16: it's possible for a document to have metadata without extrameta (but some others do have)
                     let q = selectedmetadata_udef[k];
                     let r = (elem_fileresult.metadata.extrameta === undefined || elem_fileresult.metadata.extrameta[q] === undefined)
                           ? "-" : elem_fileresult.metadata.extrameta[q];
                     tmp_datarow.push(r);
						}
						tmp_datarow.push(elem_fileresult.termscount);
						tmp_datarow.push(elem_fileresult.totaloccur);

                  // 2018-07-11: the output is a bit complicated when synonymEnabled...
                  var termList = elem_fileresult.termlist;
                  var listDetails = elem_fileresult.detail;
                  if (synonymEnabled) {
                     // extract (term, tf) from details
                     var primaryTermListHash = {};             // primaryTermListHash[primary] = [{term,freq},...]
                     var primaryTfHash = {};                   // { primary_1:totalTf, primary_2:totalTf, ...}
                     var regexp = /^\s*(\S+)\((\d+)\)$/;       // note: requires to strip the leading spaces
                     listDetails.forEach(function(item) {
                        var result = regexp.exec(item);        // null if no matches found
                        if (result) {
                           let [orig, term, tf] = result;
                           tf = parseInt(tf);                  // convert string to integer
                           let termPrimary = termToPrimaryMap[term];
                           if (primaryTermListHash[termPrimary] === undefined) {
                              primaryTermListHash[termPrimary] = [];
                              primaryTfHash[termPrimary] = 0;
                           }
                           primaryTermListHash[termPrimary].push({term:term, tf:tf});
                           primaryTfHash[termPrimary] += tf;
                        }
                        else alert("item: " + item + " cannot be recognized");
                     });

                     // (1). sort term list: sort termTfList
                     var termTfList = [];
                     for (var key in primaryTfHash) termTfList.push({term:key, tf:primaryTfHash[key]});
                     termTfList.sort(sortArrayByElementField('tf','desc'));
                     //alert(JSON.stringify(termTfList));

                     // (2). generate the finalTermList (primary list) and finalDetailsList
                     //      finalTermList: primary1; primary2(t2_1, t2_2); primary3; ...  ==> account as primary2, but occur as t2_1, t2_2 in texts
                     //      finalDetailsList: primary1:n1; primary2:n2(t2_1:n2_1, t2_2:n2_2); primary3:n3; ...   ==> account as primary2 with total n2, where occur as t2_1 with n2_1 times, as t2_2 with n2_2 times
                     var finalTermList = [];
                     var finalDetailsList = [];
                     termTfList.forEach(function(element) {
                        let primary = element.term;
                        if (primaryTermListHash[primary].length > 1 || primaryTermListHash[primary][0].term !== primary) {
                           // sort term alias before output
                           primaryTermListHash[primary].sort(sortArrayByElementField('tf','desc'));
                           let aliasList = [];
                           let aliasDetailsList = [];
                           primaryTermListHash[primary].forEach(function(element) {
                              aliasList.push(element.term);
                              aliasDetailsList.push(element.term + ':' + element.tf);
                           });
                           finalTermList.push(primary + "(" + aliasList.join(", ") + ")");
                           finalDetailsList.push(primary + ":" + primaryTfHash[primary] + "(" + aliasDetailsList.join(", ") + ")");
                        }
                        else {
                           finalTermList.push(primary);
                           finalDetailsList.push(primary + ":" + primaryTfHash[primary]);
                        }
                     });
                     tmp_datarow.push(finalTermList.join(";"));
                     tmp_datarow.push(finalDetailsList.join(";"));
                  }
						else {
                     tmp_datarow.push(termList.join(";"));
                     tmp_datarow.push(listDetails.join(";"));
                  }

						outputdatalist.push(tmp_datarow);
					}
				}

				break;
			case "categorizedterm":
            // output row: Category, Corpus, Filename, (Optional Metadata), Term, (Optional Primary), Frequency (tf)
				filenameheader = "Result_CategorizedTermResult_";
				csvheaders = ["Category"];

				for(i = 0, li = docuskymetamap_required.length; i < li; i++){
					csvheaders.push(docuskymetamap_required[i][1]);
				}

				$("#output-terms-filemetadata .outputoptions-cbox-term-metadata-ds:checked").each(
					function(elem, idx){
						selectedmetadata_ds.push($(this).val());
						csvheaders.push($(this).val());
						return;
					}
				);
				$("#output-terms-filemetadata .outputoptions-cbox-term-metadata-udef:checked").each(
					function(elem, idx){
						selectedmetadata_udef.push($(this).val());
						csvheaders.push($(this).val());
						return;
					}
				);
				csvheaders.push("Term");
            if (synonymEnabled) csvheaders.push("Primary");
				$("#output-terms-xmlattribute .outputoptions-cbox-term-xmlattr:checked").each(
					function(elem, idx){
						selectedxmlattr.push($(this).val());
						csvheaders.push($(this).val());
						return;
					}
				);
				csvheaders.push("Frequency");

            // Category, Corpus, Filename, (Optional Metadata), Term, (Optional Primary), tf
				var xmltagkeystr = "";
				var xmltagattrstrs = [];
				var xmltagkeypool = {};
				var tmp_tagattrs = {};
				var elem_xmltagkey, elem_xmltagresult;

				switch(result.type){
					case "fulltext":
						for(i = 0, li = result.categorizeddocumentresult.length; i < li; i++){
							elem_categoryresult = result.categorizeddocumentresult[i];
							for(j = 0, lj = elem_categoryresult["document-list"].length; j < lj; j++){
								elem_fileresult = elem_categoryresult["document-list"][j];
								for(k = 0, lk = elem_fileresult.termlist.length; k < lk; k++){
									tmp_datarow = [];
                           // Category
                           var recordCategory = elem_categoryresult["category-name"];
									tmp_datarow.push(recordCategory);
                           // Metadata (e.g., Corpus)
									for(p = 0, lp = docuskymetamap_required.length; p < lp; p++){
										tmp_datarow.push(elem_fileresult.metadata[docuskymetamap_required[p][1]]);
									}
									for(p = 0, lp = selectedmetadata_ds.length; p < lp; p++){
										tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_ds[p]]);
									}
                           //alert(JSON.stringify(selectedmetadata_udef));
                           //alert(JSON.stringify(elem_fileresult.metadata));
									for(p = 0, lp = selectedmetadata_udef.length; p < lp; p++){
										//tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_udef[p]]);
                              // 2018-11-15: it is possible that, in a corpus, the API returns some documents having extrameta (and some without extrameta)!
                              let q = selectedmetadata_udef[p];
                              let r = (elem_fileresult.metadata.extrameta === undefined || elem_fileresult.metadata.extrameta[q] === undefined)
                                    ? '-': elem_fileresult.metadata.extrameta[q];
										tmp_datarow.push(r);      // 2018-05-01, 2018-11-15: Tu fix
									}
                           var term = elem_fileresult.termlist[k];
									tmp_datarow.push(term);                                // Term
                           if (synonymEnabled) {                                  // 2018-07-07
                              synonymMapArray.forEach(function(element) {
                                 if (element.name === recordCategory) {
                                    termToPrimaryMap = element.termToPrimaryMap;
                                    return;
                                 }
                              });
                              tmp_datarow.push(termToPrimaryMap[term]);           // Primary
                           }
									tmp_datarow.push(elem_fileresult.termfreqlist[k]);     // tf
									outputdatalist.push(tmp_datarow);
								}
							}
						}
						break;
					case "xmltag":
						for(i = 0, li = result.xmldetailresult.length; i < li; i++){
							elem_fileresult = result.xmldetailresult[i];          // {metadata:{Corpus,Filename,...,extrameta:{...},Passageid},taglist:[{category,text,attrs},...]}
							xmltagkeypool = {};
                     //alert(JSON.stringify(elem_fileresult));
							for(j = 0, lj = elem_fileresult.taglist.length; j < lj; j++){
								elem_termresult = elem_fileresult.taglist[j];
								xmltagkeystr = "" + elem_termresult.category + "_" + elem_termresult.text + "_";
								xmltagattrstrs = [];
								tmp_tagattrs = {};
								for(k = 0, lk = selectedxmlattr.length; k < lk; k++){
									if(elem_termresult.attrs[selectedxmlattr[k]] !== undefined){
										xmltagattrstrs.push(selectedxmlattr[k] + "=" + elem_termresult.attrs[selectedxmlattr[k]]);
										tmp_tagattrs[selectedxmlattr[k]] = elem_termresult.attrs[selectedxmlattr[k]];
									}
								}
								xmltagkeystr += xmltagattrstrs.join("&");
								if(!xmltagkeypool[xmltagkeystr]){
									xmltagkeypool[xmltagkeystr] = {
										"category": elem_termresult.category,
										"text": elem_termresult.text,
										"attrs": tmp_tagattrs,
										"freq": 0
									};
								}
								xmltagkeypool[xmltagkeystr].freq += 1;
							}
							// Extend the result
							for(elem_xmltagkey in xmltagkeypool){
								tmp_datarow = [];
								elem_xmltagresult = xmltagkeypool[elem_xmltagkey];
                        var recordCategory = elem_xmltagresult.category;       // Category
								tmp_datarow.push(recordCategory);
								for(k = 0, lk = docuskymetamap_required.length; k < lk; k++){
									tmp_datarow.push(elem_fileresult.metadata[docuskymetamap_required[k][1]]);
								}
								for(k = 0, lk = selectedmetadata_ds.length; k < lk; k++){
									tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_ds[k]]);
								}
								for(k = 0, lk = selectedmetadata_udef.length; k < lk; k++){
                           //alert('==>' + JSON.stringify(elem_fileresult.metadata));
									//tmp_datarow.push(elem_fileresult.metadata.extrameta[selectedmetadata_udef[k]]);    // 2018-05-09: Tu fix (extrameta)
                           // 2018-11-15: it is possible that, in a corpus, the API returns some documents having extrameta (and some without extrameta)!
                           let q = selectedmetadata_udef[k];                  // 2019-03-02 bug fix
                           let r = (elem_fileresult.metadata.extrameta === undefined || elem_fileresult.metadata.extrameta[q] === undefined)
                                 ? '-': elem_fileresult.metadata.extrameta[q];
									tmp_datarow.push(r);      // 2018-05-01, 2018-11-15: Tu fix
								}

                        var term = elem_xmltagresult.text;                          // Term
								tmp_datarow.push(term);
								for(k = 0, lk = selectedxmlattr.length; k < lk; k++){
									tmp_datarow.push(elem_xmltagresult.attrs[selectedxmlattr[k]]);
								}

                        if (synonymEnabled) {                                       // 2018-07-07
                           synonymMapArray.forEach(function(element) {
                              if (element.name === recordCategory) {
                                 termToPrimaryMap = element.termToPrimaryMap;
                                 return;
                              }
                           });
                           tmp_datarow.push(termToPrimaryMap[term]);                // Primary
                        }

								tmp_datarow.push(elem_xmltagresult.freq);                   // tf
								outputdatalist.push(tmp_datarow);
							}
						}

						break;
				}
				break;
			case "fileCategorizedTerms":
            // output row: Filename, PassageId, TermsInCategory#1, TermsInCategory#2, ...
            // 2018-05-10: Tu -- currently only supports "tags" (no metadata fields) as categories
            // Since we will regard terms in each tag type as a termlist, this output can be useful in showing filename, tagtype, tagged_terms
				filenameheader = "FileCategorizedTerms_";
				csvheaders = ["Filename", "PassageId"];

            var categories = [];
            var fileCategorizedTerms = {};
				for(i = 0, li = result.categorizeddocumentresult.length; i < li; i++){
					elem_categoryresult = result.categorizeddocumentresult[i];    // { category-name, document-list:[doc,...] }, each doc = { metadata, termscount, totaloccur, termlist, termfreqlist, detail}
               //alert(JSON.stringify(elem_categoryresult));
               var categoryName = elem_categoryresult["category-name"];
               categories.push(categoryName);                                // each tagtype (category) occupies one column
					for(j = 0, lj = elem_categoryresult["document-list"].length; j < lj; j++){
						elem_fileresult = elem_categoryresult["document-list"][j];
                  var filename = elem_fileresult.metadata["Filename"];
                  var passageId = elem_fileresult.metadata["Passageid"];     // 2018-06-30
                  var termList = elem_fileresult['termlist'];
                  var filenamePassageId = filename + ":" + passageId;        // 2018-06-30
                  if (fileCategorizedTerms[filenamePassageId] === undefined) fileCategorizedTerms[filenamePassageId] = {};
                  fileCategorizedTerms[filenamePassageId][categoryName] = termList;
               }
            }
            csvheaders = csvheaders.concat(categories);
            //alert(JSON.stringify(csvheaders));

            for (var filenamePassageId in fileCategorizedTerms) {
               var [filename, passageId] = filenamePassageId.split(/:/g);      // ES6 Destructuring Assignment (array or object)
               tmp_datarow = [];
               tmp_datarow.push(filename);
               tmp_datarow.push(passageId);
               for (var i=0; i<categories.length; i++) {                       // each tagtype (category) occupies one column
                  var categoryName = categories[i];
                  var termList = fileCategorizedTerms[filenamePassageId][categoryName] || '';
                  //alert(filename + ':' + categoryName + ':' + termList);
                  tmp_datarow.push(termList);
               }
               outputdatalist.push(tmp_datarow);
            }
				break;
         default:    // Tu
            alert("Error: unknown type '" + type + "'");
		}
		
		
		if(typeof(param)=='object' && format === "csv" && 'clipboard' in param && param.clipboard==1){
		    sheetarrtocsv(csvheaders, outputdatalist, param);
		    
		}else{
    	    if(format === "csv" || format === "json"){
    			blob = new Blob(new Array( (format === "csv") ? sheetarrtocsv(csvheaders, outputdatalist) : JSON.stringify({ "headers": csvheaders, "data": outputdatalist })), {"type": "text/plain;charset=utf-8"});
    			saveAs(blob, filenameheader + timetag + ((format === "csv") ? ".csv" : ".json"));
    		} else {	// Update to DocuSky
    			DSMultiFileUpload(
    				docuSkyObj_file,
    				[{ "category": "DocuTools", "datapath": "TermStat/Results", "filename": filenameheader + timetag + ".json", "json": { "headers": csvheaders, "data": outputdatalist } }],
    				[function(data){ alert("成功上傳檔案：「" + data.files[0] + "」"); return; }],
    				[function(data){ alert("出現錯誤"); return; } ]
    			);
    		}
		}
		
		return; 

	};
})();
