var TermStat = new (function(){	
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
		//return $('<div/>').append(str).text().replace(/[\s\uFEFF\xA0]/g, '');
		return $('<div/>').append(str).text().replace(/[\uFEFF\xA0]/g, '');             // 2018-09-07: Tu fix
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
	var sheetarrtocsv = function(header, data){
		var result = "";
		var linestrs = [];
		var i, li;
		linestrs.push(arraddquo(header).join(","));
		for(i = 0, li = data.length; i < li; i++){
			linestrs.push(arraddquo(data[i]).join(","));
		}
		return linestrs.join("\n");
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
		["docBookCode", "Bookcode"],
		["docSource", "Source"],
      ["timeInfo/dateAdYear", "AdYear"],           // 2017-12-25: Tu
      ["timeInfo/dateAdDate", "AdDate"],           // 2017-12-25
      ["timeInfo/dateOrigStr", "DateOrigStr"],     // 2017-12-25
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
		
		var stack = [elem.childNodes];	// initialize
		
		while (stack.length !== 0){
			childnodes = stack.pop();
			if(childnodes !== undefined){
				// 1. get node contents  2. push the node into stack
				for(i = 0, li = childnodes.length; i < li; i++){
					childnode = childnodes[i];
					if(childnode.nodeType === 1  && htmltags.indexOf(childnode.nodeName) < 0){	// It is an element node, and not an HTML tag.
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
						if(childnode.hasChildNodes()){
							stack.push(childnode.childNodes);
						}
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
				$("#dialog-termlist").html(savedlist_termlist[idx].contentcsv.replace(/\r\n|\r|\n|,/g, "<br/>"));
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
		
		// Enable saving buttons
		$("#outputfile-basicfreq").attr("disabled", false);
		$("#outputfile-categorizedfile").attr("disabled", false);
		$("#outputfile-categorizedterm").attr("disabled", false);
		$("#outputjson-basicfreq").attr("disabled", false);
		$("#outputjson-categorizedfile").attr("disabled", false);
		$("#outputjson-categorizedterm").attr("disabled", false);
		$("#uploaddocusky-basicfreq").attr("disabled", false);
		$("#uploaddocusky-categorizedfile").attr("disabled", false);
		$("#uploaddocusky-categorizedterm").attr("disabled", false);
		
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
			
			// User-defined metadata (DOMParser will cause error when giving undefined as input)
			extrametaxml = (elem_docinfo.docMetadataXml !== undefined) ? parser.parseFromString(elem_docinfo.docMetadataXml, "text/xml").children[0] : undefined;
			if(extrametaxml && extrametaxml.tagName === "DocMetadata"){
				extrametaxml = extrametaxml.children;
				for(j = 0, lj = extrametaxml.length; j < lj; j++){
					elem_exrameta = extrametaxml[j];
					tmp_extrameta[elem_exrameta.tagName] = elem_exrameta.textContent;
				}
				tmp_filemeta["extrameta"] = tmp_extrameta;
			}
			
			// Text content
			xmlstr = elem_docinfo.docContentXml;
			// textcontent = tohtmlstr(xmlstr);
			
			// Try to parse docContentXml, and split contents in <Passage> if the tag exists.
			// If error happens, only extract text nodes out.
			parsedxml = parser.parseFromString(xmlstr, "text/xml");
			
			if( parsedxml.getElementsByTagName("parsererror").length === 0 ){
				// 20170621: Only get content in <Passage> tags under <Content> tags.
				paragraphs = parsedxml.querySelectorAll("Content>Paragraph");
				if( paragraphs.length !== 0 ){
					for(j = 0, lj = paragraphs.length; j < lj; j++){
						xmltaggingdata = getxmltaggingdata(paragraphs[j]);
						tempdspages_corpus.push({
							// 20170621: New an empty object, then assing passage_id along with values in tmp_filemeta
							"metadata": Object.assign({}, tmp_filemeta, {"Passageid": (j + 1).toString()}),
							"xmltext": xmltagandtextextract("<Content>" + paragraphs[j].innerHTML + "</Content>"),
							"text": tohtmlstr(paragraphs[j].innerHTML),
							"xmltaggingdata": xmltaggingdata
						});
					}
				} else {	// 20170621: Find the first <Content> tag. If not found, use the whole file content
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
			} else {	// Basically it won't happen. (XML content saved on DocuSky is well-formed)
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
		}
		
		// remove 'extrameta' from metanamelist
		if(metanamelist_docusky.indexOf("extrameta") >= 0){
			metanamelist_docusky.splice(metanamelist_docusky.indexOf("extrameta"), 1);
		}

		savedlist_corpus.push( { "name": docuSkyObj_doc.corpus, "num": tempdspages_corpus.length, "docs": tempdspages_corpus, "xmltaglist": taglist, "metanamelist_docusky": metanamelist_docusky, "metanamelist_userdef": metanamelist_userdef } );
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
					if (psize > 160) psize = 160;                   // 2018-06-02 (Tu): set pagesize bound
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
	
	var tempfile_corpus = [];
	var tempfile_termlist = [];
	var tempdspages_corpus = [];
	var savedlist_corpus = [];
	var savedlist_termlist = [];
	var result = {};
	var timetag = "";
	
	this.loadCorpusFiles = function(){
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
			if(!fl.type || fl.type !== "text/plain"){
				alert('File "' + fl.name + '" is not pure text file. Please make sure all selected files are in pure text format.');
				$("#addcorpus-clientfile-textfiles").val("").trigger("change");
				return;
			}
		}
		
		startLoading();
		
		// 20170621: XML content
		mtr.readFiles(files, "text",
			[function(data){
				var i, li, j, lj;
				var tmp_metadata = {};
				var filestr = "", parsedxml;
				var paragraphs, xmltaggingdata, contentxml;
				var parser = new DOMParser();
				
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
	
	this.loadTermListFiles = function(){
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
	
	/* 20170420 deprecated
	this.selectAllCorpus = function(s){
		var select = (s === undefined) ? true : s;
		$("#analysis-choosecorpus input[type='checkbox']").each(function(idx, elem){
			$(this).prop("checked", select);
		});
		return;
	};
	
	this.selectAllTermList = function(s){
		var select = (s === undefined) ? true : s;
		$("#analysis-choosetermlist input[type='checkbox']").each(function(idx, elem){
			$(this).prop("checked", select);
		});
		return;
	};
	*/
	
	/*
	this.searchInTags = function(){
		var i, li;
		var corpusids = [], testdocuments = [], taglist = [];
		
		$("#analysis-choosecorpus input[type='checkbox']:checked").each(function(idx, elem){
			corpusids.push($(this).val());
		});

		if($("#searchintags").is(":checked")){
			for(i = 0, li = corpusids.length; i < li; i++){
				testdocuments = testdocuments.concat(savedlist_corpus[corpusids[i]].docs);
			}
			for(i = 0, li = testdocuments.length; i < li; i++){
				taglist = arrmerge(taglist, (testdocuments[i].tagnames || []));
			}
			console.log(taglist.join(", "));
		} else {
			
		}
		return;
	};
	*/
	/*
	var analysisPreview_FullText = function(){
		var corpusids = [], termlistids = [];
		var testdocuments = [], testtermlists = [], corpusnames = [];;
		var htmlstr = "";
		var i, li;
		
		// Check if available
		$("#analysis-choosecorpus input[type='checkbox']:checked").each(function(idx, elem){
			corpusids.push($(this).val());
		});
		$("#analysis-choosetermlist input[type='checkbox']:checked").each(function(idx, elem){
			termlistids.push($(this).val());
		});
		
		if(corpusids.length === 0){
			$("#analysispreview-ft-corpuslist").empty().append("<tr><th>No selected corpus.</th></tr>");
		} else {
			htmlstr = "<tr><th>Selected Corpora</th></tr>";
			for(i = 0, li = corpusids.length; i < li; i++){
				
				corpusnames.push(savedlist_corpus[corpusids[i]].name);
			}
			$("#analysispreview-ft-corpuslist").empty().append(htmlstr);
		}
		
		if(termlistids.length === 0){
			$("#analysispreview-ft-termlist").empty().append("<tr><th>No selected term list.</th></tr>");
		} else {
			htmlstr = "<tr><th>Selected Term Lists</th></tr>";
			for(i = 0, li = termlistids.length; i < li; i++){
				htmlstr = htmlstr + "<tr><td>" +  savedlist_termlist[termlistids[i]].name + "</td></tr>";
			}
			$("#analysispreview-ft-termlist").empty().append(htmlstr);
		}
		
		if(corpusids.length === 0 || termlistids.length === 0){
			$("#analysis-run-fulltext").attr("disabled", "disabled");
		} else {
			$("#analysis-run-fulltext").removeAttr("disabled").off("click").on("click", function(e){
				$("#dialog-analysispreview").dialog("close");
				for(i = 0, li = corpusids.length; i < li; i++){
					testdocuments = testdocuments.concat(savedlist_corpus[corpusids[i]].docs);
				}
				for(i = 0, li = termlistids.length; i < li; i++){
					testtermlists.push(savedlist_termlist[termlistids[i]]);
				}
				runAnalysis({"type": "fulltext", "docs": testdocuments, "termlists": testtermlists, "corpusnames": corpusnames});
				return;
			});
		}
		
		$("#termstat-analysispreview-xmltag").hide();
		$("#termstat-analysispreview-fulltext").show();
		$("#dialog-analysispreview").dialog("open");
		
		return;
	}
	
	var analysisPreview_XmlTag = function(){
		var corpusids = [];
		var corpusnames = [];
		var testdocuments = [];
		var xmltaglist = [];
		var htmlstr = "";
		var i, li, j, lj;
		var tagname = "";
		
		$("#analysis-choosecorpus input[type='checkbox']:checked").each(function(idx, elem){
			corpusids.push($(this).val());
		});

		for(i = 0, li = corpusids.length; i < li; i++){
			if(savedlist_corpus[corpusids[i]].xmltaglist !== undefined){
				xmltaglist = arrmerge(xmltaglist, savedlist_corpus[corpusids[i]].xmltaglist);
			}
		}
		
		if(corpusids.length === 0){
			$("#analysispreview-xt-corpuslist").empty().append("<tr><th>No selected corpus.</th></tr>");
		} else {
			htmlstr = "<tr><th>Selected Corpora</th></tr>";
			for(i = 0, li = corpusids.length; i < li; i++){
				htmlstr = htmlstr + "<tr><td>" +  savedlist_corpus[corpusids[i]].name + "</td></tr>";
				corpusnames.push(savedlist_corpus[corpusids[i]].name);
			}
			$("#analysispreview-xt-corpuslist").empty().append(htmlstr);
		}
		
		htmlstr = "";
		if(xmltaglist.length !== 0){
			htmlstr = "<tr><th></th><th>Tag Name</th><th>Filtering Term List</th></tr>"
			for(i = 0, li = xmltaglist.length; i < li; i++){
				tagname = xmltaglist[i];
				htmlstr = htmlstr +
					'<tr>' +
						'<td class="align-center"><div class="cbox">' +
							'<input type="checkbox" class="termstat-preview-cbox-selecttag" value="' + tagname + '" id="termstat-xmltag-' + tagname + '"/>' +
							'<label for="termstat-xmltag-' + tagname + '"></label>' +
						'</div></td>' +
						'<td>' + tagname + '</td>' +
						'<td class="align-center">' +
							'<select class="termstat-preview-select-filter" name="termstat-xmltag-' + tagname + '-select" disabled="disabled">' +
							'<option value="none">No Filtering</option>';
				for(j = 0, lj = savedlist_termlist.length; j < lj; j++){
					htmlstr = htmlstr + '<option value="' + j + '">' + savedlist_termlist[j].name + '</option>';
				}
				htmlstr = htmlstr + '</select></td></tr>';
			}
		} else {
			htmlstr = "<tr><th>No XML tag exist.</th></tr>";
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
		
		
		
		if(corpusids.length === 0 || xmltaglist.length === 0){
			$("#analysis-run-xmltag").off("click").attr("disabled", "disabled");
		} else {
			$("#analysis-run-xmltag").removeAttr("disabled").off("click").on("click", function(e){
				var selected_tagnames = [], filterlistmap = {}, filterlist = {};
				var filtergroup = $("#analysispreview-xt-taglist .termstat-preview-select-filter");
				var selectedtagname = "", filterlistid = "";
				var selectedtermlist = {};

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
				
				for(i = 0, li = corpusids.length; i < li; i++){
					testdocuments = testdocuments.concat(savedlist_corpus[corpusids[i]].docs);
				}

				$("#dialog-analysispreview").dialog("close");
				runAnalysis({"type": "xmltag", "docs": testdocuments, "xmltagginginfo": { "tagnames": selected_tagnames, "filtermap": filterlistmap, "filterlist": filterlist }, "corpusnames": corpusnames});
				return;
			});
		}
		
		$("#termstat-analysispreview-fulltext").hide();
		$("#termstat-analysispreview-xmltag").show();
		$("#dialog-analysispreview").dialog("open");
		return;
	}
	*/
	/* 20170420 deprecated
	this.analysisPreview = function(){
		var searchinxmltags = $("input#searchintags").is(":checked");
		if(searchinxmltags){
			analysisPreview_XmlTag();
		} else {
			analysisPreview_FullText();
		}
		return;
	}
	*/
	
	this.runAnalysis = function(type){
		var params = {}, docs = [], termlists = [], corpusnames = [], meta_ds = [], meta_user = [];
		var selected_tagnames = [], filterlistmap = {}, filterlist = {};
		var selectedtagname = "", filterlistid = "", selectedtermlist = {};
		var i, li;
		var filtergroup = $("#analysispreview-xt-taglist .termstat-preview-select-filter");
		
		switch(type){
			case "text":
				for(i = 0, li = savedlist_corpus.length; i < li; i++){
					meta_ds = arrmerge(meta_ds, savedlist_corpus[i].metanamelist_docusky);
					meta_user = arrmerge(meta_user, savedlist_corpus[i].metanamelist_userdef);
					docs = docs.concat(savedlist_corpus[i].docs);
					corpusnames.push(savedlist_corpus[i].name);
				}
				for(i = 0, li = savedlist_termlist.length; i < li; i++){
					termlists.push(savedlist_termlist[i]);
				}
				runAnalysis_FullText({
					"type": "fulltext",
					"docs": docs,
					"termlists": termlists,
					"corpusnames": corpusnames,
					"metanamelist_docusky": meta_ds,
					"metanamelist_userdef": meta_user
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
			
			if(c.msgtype === 0){
				$("#loadingmessage").text(c.msg);
				$("div.processbar-ratio").css("width", Number.parseInt(c.process * 250));
			} else if(c.msgtype === 1){
				myworker.terminate();
				result = c.result;
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
		
		myworker.postMessage(params);
		return;
	};
	
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
	
	this.saveFile = function(type, format){
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
				filenameheader = "Result_BasicFrequencies_";
				csvheaders = ["Category", "Term" ,"TF", "DF"];
				for(i = 0, li = result.basicfrequencyresult.length; i < li; i++){
					elem_data = result.basicfrequencyresult[i];
					outputdatalist.push([
						elem_data.category,
						elem_data.term,
						elem_data.tf,
						elem_data.df
					]);
				}
				break;
			case "categorizedfile":
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
					elem_categoryresult = result.categorizeddocumentresult[i];
					for(j = 0, lj = elem_categoryresult["document-list"].length; j < lj; j++){
						elem_fileresult = elem_categoryresult["document-list"][j];
						tmp_datarow = [];
						tmp_datarow.push(elem_categoryresult["category-name"]);
						for(k = 0, lk = docuskymetamap_required.length; k < lk; k++){
							tmp_datarow.push(elem_fileresult.metadata[docuskymetamap_required[k][1]]);
						}
						for(k = 0, lk = selectedmetadata_ds.length; k < lk; k++){
							tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_ds[k]]);
						}
						for(k = 0, lk = selectedmetadata_udef.length; k < lk; k++){
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
						tmp_datarow.push(elem_fileresult.termlist.join(","));
						tmp_datarow.push(elem_fileresult.detail.join(","));

						outputdatalist.push(tmp_datarow);
					}
				}

				break;
			case "categorizedterm":
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
				$("#output-terms-xmlattribute .outputoptions-cbox-term-xmlattr:checked").each(
					function(elem, idx){
						selectedxmlattr.push($(this).val());
						csvheaders.push($(this).val());
						return;
					}
				);
				csvheaders.push("Frequency");
				
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
									tmp_datarow.push(elem_categoryresult["category-name"]);
									for(p = 0, lp = docuskymetamap_required.length; p < lp; p++){
										tmp_datarow.push(elem_fileresult.metadata[docuskymetamap_required[p][1]]);
									}
									for(p = 0, lp = selectedmetadata_ds.length; p < lp; p++){
										tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_ds[p]]);
									}
									for(p = 0, lp = selectedmetadata_udef.length; p < lp; p++){
										//tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_udef[p]]);
										//tmp_datarow.push(elem_fileresult.metadata.extrameta[selectedmetadata_udef[p]]);      // 2018-05-01: Tu fix
                              // 2018-11-15: it is possible that, in a corpus, the API returns some documents having extrameta (and some without extrameta)!
                              let q = selectedmetadata_udef[p];
                              let r = (elem_fileresult.metadata.extrameta === undefined || elem_fileresult.metadata.extrameta[q] === undefined) 
                                    ? '-': elem_fileresult.metadata.extrameta[q]; 
								   	tmp_datarow.push(r);      // 2018-05-01, 2018-11-15: Tu fix
									}
									tmp_datarow.push(elem_fileresult.termlist[k]);
									tmp_datarow.push(elem_fileresult.termfreqlist[k]);
									outputdatalist.push(tmp_datarow);
								}
							}
						}
						break;
					case "xmltag":
						for(i = 0, li = result.xmldetailresult.length; i < li; i++){
							elem_fileresult = result.xmldetailresult[i];
							xmltagkeypool = {};
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
								tmp_datarow.push(elem_xmltagresult.category);
								for(k = 0, lk = docuskymetamap_required.length; k < lk; k++){
									tmp_datarow.push(elem_fileresult.metadata[docuskymetamap_required[k][1]]);
								}
								for(k = 0, lk = selectedmetadata_ds.length; k < lk; k++){
									tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_ds[k]]);
								}
								for(k = 0, lk = selectedmetadata_udef.length; k < lk; k++){
									//tmp_datarow.push(elem_fileresult.metadata[selectedmetadata_udef[p]]);
                           // 2018-11-15: it is possible that, in a corpus, the API returns some documents having extrameta (and some without extrameta)!
                           let q = selectedmetadata_udef[p];
                           let r = (elem_fileresult.metadata.extrameta === undefined || elem_fileresult.metadata.extrameta[q] === undefined) 
                                 ? '-': elem_fileresult.metadata.extrameta[q]; 
									tmp_datarow.push(r);      // 2018-05-01, 2018-11-15: Tu fix
								}
								tmp_datarow.push(elem_xmltagresult.text);
								for(k = 0, lk = selectedxmlattr.length; k < lk; k++){
									tmp_datarow.push(elem_xmltagresult.attrs[selectedxmlattr[k]]);
								}
								tmp_datarow.push(elem_xmltagresult.freq);
								outputdatalist.push(tmp_datarow);
							}
						}

						break;
				}
				break;
		}
		
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
		
		return;
	};
})();