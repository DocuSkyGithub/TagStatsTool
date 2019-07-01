/* Receive parameters from window, then return the result */
importScripts("./general.js", "./searchgram.js");
self.addEventListener("message", function(e){
	var params = e.data;
	var termlists, doclist = params.docs;
	var min = 1, max = 20;	// 20170331 limitation on max length
	var type = params.type;
	var leninfo = [];
	var vlist = {}, vl_tmp, vlistinfo;
	var i, li, tagname, tmp_wordresult;
	
	// Form vocabulary list
	if(type === "xmltag"){
		for(i = 0, li = params.xmltagginginfo.tagnames.length; i < li; i++){
			tagname = params.xmltagginginfo.tagnames[i];
			if(params.xmltagginginfo.filtermap[tagname] !== undefined){
				vl_tmp = new TermSearcher();
				vl_tmp.addTermListByCSV(tagname, params.xmltagginginfo.filterlist[params.xmltagginginfo.filtermap[tagname]]);
				vlist[tagname] = vl_tmp;
				leninfo.push(vl_tmp.getTermLengthInfo().min);
				leninfo.push(vl_tmp.getTermLengthInfo().max);
			}
		}
	} else if(type === "fulltext") {
		vlist = new TermSearcher();
		termlists = params.termlists;
		for(i = 0, li = termlists.length; i < li; i++){
			vlist.addTermListByCSV(termlists[i]["name"], termlists[i]["contentcsv"]);
		}
		leninfo = [vlist.getTermLengthInfo().min, vlist.getTermLengthInfo().max];
	}
	// Decide range of term length
	leninfo.sort(function(a, b){ return a - b });	// 20170704 sort() uses string encoding-order as default sorting...
	min = (leninfo.length !== 0 && min < leninfo[0]) ? leninfo[0] : min;
	max = (leninfo.length !== 0 && max > leninfo[leninfo.length - 1]) ? leninfo[leninfo.length - 1] : max;
	
	// This part will be changed in order to give message to main code(progress).
	var gs = (type === "xmltag") ? new GramSearcherFromXml() : new GramSearcherFromText();
	var statresult;
	// var vocabularyresult = [];
	var categorizeddocresult = [];
	var xmltagdetails = [];
	
	
	var i, li, j, lj, k, lk, p, lp;
	var doc, res, tmp_result;
	var docres;
	var xml_attrlist = [];
	
	if(type === "xmltag"){
		statresult = { "result-normal": [], "result-categorized": [] };
		for(i = 0, li = doclist.length; i < li; i++){
			doc = doclist[i];
			res = gs.searchInXml(doc.xmltaggingdata || {}, params.xmltagginginfo, vlist);
			
			statresult["result-normal"].push(res["result-normal"]);
			statresult["result-categorized"].push(res["result-categorized"]);
			
			postMessage(JSON.stringify({
				"msgtype": 0,
				"msg": ("Process: " + (i + 1) + "/" + doclist.length),
				"process": (i + 1) / doclist.length
			}));
		}
	} else if (type === "fulltext") {
		statresult = { "result-normal": [], "result-categorized": [] };
		for(i = 0, li = doclist.length; i < li; i++){
			doc = doclist[i];
			res = gs.searchGram(doc.text, "。", vlist, min, max);
			
			statresult["result-normal"].push(res["result-normal"]);
			statresult["result-categorized"].push(res["result-categorized"]);
			
			postMessage(JSON.stringify({
				"msgtype": 0,
				"msg": ("Process: " + (i + 1) + "/" + doclist.length),
				"process": (i + 1) / doclist.length
			}));
		}
	}
	
	postMessage(JSON.stringify({
		"msgtype": 0,
		"msg": "Analysis Done. Saving Result...",
		"process": 1
	}));
	
	var wordclouddata_obj = {};
	var wordclouddata_arr = {};
	var corpusname, elem_word;
	
	for(i = 0, li = params.corpusnames.length; i < li; i++){
		wordclouddata_obj[params.corpusnames[i]] = {};
		wordclouddata_arr[params.corpusnames[i]] = [];
	}
	
	var catresult = {};	// identical word result
	var result_basicfreq = [];
	var wordpool = {};
	var result_xmldetail = [];
	
	var tmp_docresult, tmp_termresult;
	var key_categoryname, key_termname, key_corpusname;
	var targettaglist;
	var j, lj, k, lk;
	
	if(type === "fulltext"){
		for(i = 0, li = statresult["result-normal"].length; i < li; i++){
			tmp_docresult = statresult["result-normal"][i];
			wordpool = {};	// 20170705: reset wordpool
			for(j = 0, lj = tmp_docresult.length; j < lj; j++){
				tmp_termresult = tmp_docresult[j];
				// result_basicfreq
				if(catresult[tmp_termresult.category] === undefined){
					catresult[tmp_termresult.category] = {};
				}
				if(catresult[tmp_termresult.category][tmp_termresult.term] === undefined){
					catresult[tmp_termresult.category][tmp_termresult.term] = { "tf": 0, "df": 0 };
				}
				catresult[tmp_termresult.category][tmp_termresult.term].tf += tmp_termresult.freq;
				catresult[tmp_termresult.category][tmp_termresult.term].df += 1;
			
				// wordclouddata
				// 20170705: To avoid freq calculation problem from terms in multiple categories, we use a wordpool to check if freq of this term has been calculated in this document
				
				if(wordclouddata_obj[doclist[i]["metadata"]["Corpus"]][tmp_termresult["term"]] === undefined){
					wordclouddata_obj[doclist[i]["metadata"]["Corpus"]][tmp_termresult["term"]] = 0;
				}
				if(!wordpool[tmp_termresult["term"]]){
					wordclouddata_obj[doclist[i]["metadata"]["Corpus"]][tmp_termresult["term"]] += tmp_termresult["freq"];
					wordpool[tmp_termresult["term"]] = true;
				}
			}
		}
		
		// output to array
		for(key_categoryname in catresult){
			for(key_termname in catresult[key_categoryname]){
				result_basicfreq.push({
					"category": key_categoryname,
					"term": key_termname,
					"tf": catresult[key_categoryname][key_termname].tf,
					"df": catresult[key_categoryname][key_termname].df
				});
			}
		}
		
		result_basicfreq.sort(function(a, b){
			if(a.category === b.category){
				return b.tf - a.tf;
			} else {
				return a.category > b.category;
			}
		});
		
		for(key_corpusname in wordclouddata_obj){
			for(key_termname in wordclouddata_obj[key_corpusname]){
				wordclouddata_arr[key_corpusname].push({
					"text": key_termname,
					"weight": wordclouddata_obj[key_corpusname][key_termname],
					"html": { "title": key_termname + "\nTerm Freq: " + wordclouddata_obj[key_corpusname][key_termname] }
				});
			}
			// Due to space limitation, terms with low frequency are less likely to be printed on word cloud.
			wordclouddata_arr[key_corpusname] = wordclouddata_arr[key_corpusname].sort(function(a, b){
				return b.weight - a.weight;
			}).slice(0, 60);
		}
		
		
		
		/*
		for(i = 0, li = statresult["result-normal"].length; i < li; i++){
			tmp_result = statresult["result-normal"][i];
			documentresult.push({
				"corpus": doclist[i]["corpus"],
				"filename": doclist[i]["filename"],
				"title": doclist[i]["title"],
				"source": doclist[i]["source"],
				"docclass": doclist[i]["docclass"],
				"order": doclist[i]["order"],
				"passageid": doclist[i]["passageid"],
				"extrameta": doclist[i]["extrameta"],
				"termscount": tmp_result.length,
				"totaloccur": 0,
				"wordlist": []
			});
			for(j = 0, lj = tmp_result.length; j < lj; j++){
				tmp_wordresult = tmp_result[j];
				documentresult[i]["totaloccur"] += tmp_wordresult["freq"];	// accumulate total occurence
				documentresult[i]["wordlist"].push({
					"category-id": (tmp_wordresult["category-id"] !== undefined) ? tmp_wordresult["category-id"] : undefined,
					"category-name": tmp_wordresult["category-name"],
					"word-id": (tmp_wordresult["wordid"] !== undefined) ? tmp_wordresult["wordid"] : undefined,
					"word": tmp_wordresult["word"],
					"freq": tmp_wordresult["freq"]
				});
				
				if(wordclouddata_obj[doclist[i]["corpus"]] === undefined){
					wordclouddata_obj[doclist[i]["corpus"]] = {};
				}
				if(wordclouddata_obj[doclist[i]["corpus"]][tmp_wordresult["word"]] === undefined){
					wordclouddata_obj[doclist[i]["corpus"]][tmp_wordresult["word"]] = 0;
				}
				wordclouddata_obj[doclist[i]["corpus"]][tmp_wordresult["word"]] += tmp_wordresult["freq"];
			}
		}
		for(corpusname in wordclouddata_obj){
			for(elem_word in wordclouddata_obj[corpusname]){
				wordclouddata_arr[corpusname].push({
					"text": elem_word,
					"weight": wordclouddata_obj[corpusname][elem_word],
					"html": { "title": elem_word + "\nTerm Freq: " + wordclouddata_obj[corpusname][elem_word] }
				});
			}
			wordclouddata_arr[corpusname] = wordclouddata_arr[corpusname].sort(function(a, b){
				return b.weight - a.weight;
			}).slice(0, 60);
		}
		
		wordclouddata_obj = {};	// release memory
		*/
	} else {	// XML
		for(i = 0, li = statresult["result-normal"].length; i < li; i++){
			tmp_docresult = statresult["result-normal"][i];
			wordpool = {};
			
			result_xmldetail.push({
				"metadata": doclist[i].metadata,
				"taglist": []
			});
			targettaglist = result_xmldetail[result_xmldetail.length - 1].taglist;

			for(key_categoryname in tmp_docresult){
				for(j = 0, lj = tmp_docresult[key_categoryname].length; j < lj; j++){
					tmp_termresult = tmp_docresult[key_categoryname][j];
					
					xml_attrlist = arrmerge(xml_attrlist, Object.keys(tmp_termresult.attrs));
					
					targettaglist.push({
						"category": key_categoryname,
						"text": tmp_termresult.text,
						"attrs": tmp_termresult.attrs
					});
					
					if(catresult[key_categoryname] === undefined){
						catresult[key_categoryname] = {};
					}
					
					if(catresult[key_categoryname][tmp_termresult.text] === undefined){
						catresult[key_categoryname][tmp_termresult.text] = { "tf": 0, "df": 0 };
					}
					
					catresult[key_categoryname][tmp_termresult.text].tf += 1;
					
					if(!wordpool[tmp_termresult.text]){
						catresult[key_categoryname][tmp_termresult.text].df += 1;
						wordpool[tmp_termresult.text] = true;
					}
					
					if(wordclouddata_obj[doclist[i]["metadata"]["Corpus"]][tmp_termresult["text"]] === undefined){
						wordclouddata_obj[doclist[i]["metadata"]["Corpus"]][tmp_termresult["text"]] = 0;
					}
					wordclouddata_obj[doclist[i]["metadata"]["Corpus"]][tmp_termresult["text"]] += 1;
				}
			}
		}
		
		// output to array
		for(key_categoryname in catresult){
			for(key_termname in catresult[key_categoryname]){
				result_basicfreq.push({
					"category": key_categoryname,
					"term": key_termname,
					"tf": catresult[key_categoryname][key_termname].tf,
					"df": catresult[key_categoryname][key_termname].df
				});
			}
		}
		
		result_basicfreq.sort(function(a, b){
			if(a.category === b.category){
				return b.tf - a.tf;
			} else {
				return a.category > b.category;
			}
		});

		for(key_corpusname in wordclouddata_obj){
			for(key_termname in wordclouddata_obj[key_corpusname]){
				wordclouddata_arr[key_corpusname].push({
					"text": key_termname,
					"weight": wordclouddata_obj[key_corpusname][key_termname],
					"html": { "title": key_termname + "\nTerm Freq: " + wordclouddata_obj[key_corpusname][key_termname] }
				});
			}
			
			// Due to space limitation, terms with low frequency are less likely to be printed on word cloud.
			wordclouddata_arr[key_corpusname] = wordclouddata_arr[key_corpusname].sort(function(a, b){
				return b.weight - a.weight;
			}).slice(0, 60);
		}
	}
	
	
	var catlist, targetidx, targetlist, targetres, wordres;
	var idxmap = {};
	
	if(type === "fulltext"){
		for(i = 0, li = termlists.length; i < li; i++){
			categorizeddocresult.push({
				"category-name": termlists[i].name,
				"document-list": []
			});
			idxmap[termlists[i].name] = i;
		}
		
		for(i = 0, li = statresult["result-categorized"].length; i < li; i++){
			docres = statresult["result-categorized"][i];
			for(j = 0, lj = docres.length; j < lj; j++){
				// Distribute the file's result to each occured category
				catlist = docres[j];
				targetidx = idxmap[catlist["category"]];
				targetlist = categorizeddocresult[targetidx]["document-list"];
				targetlist.push({
					"metadata": doclist[i]["metadata"],
					"termscount": 0,
					"totaloccur": 0,
					"termlist": [],
					"termfreqlist": [],
					"detail": []
				});
				targetres = targetlist[targetlist.length - 1];
				for(k = 0, lk = catlist["termlist"].length; k < lk; k++){
					// Add result
					wordres = catlist["termlist"][k];
					targetres["termscount"] += 1;
					targetres["totaloccur"] += wordres["freq"];
					targetres["termlist"].push(wordres["term"]);
					targetres["termfreqlist"].push(wordres["freq"]);
					targetres["detail"].push(wordres["term"] + "(" + wordres["freq"] + ")");
				}
			}
		}
	} else if (type === "xmltag") {
		var elem_tagname;
		for(i = 0, li = params.xmltagginginfo.tagnames.length; i < li; i++){
			categorizeddocresult.push({
				"category-name": params.xmltagginginfo.tagnames[i],
				"document-list": []
			});
			idxmap[params.xmltagginginfo.tagnames[i]] = i;
		}
		
		for(i = 0, li = statresult["result-categorized"].length; i < li; i++){
			docres = statresult["result-categorized"][i];
			
			for(elem_tagname in docres){
				if(docres[elem_tagname].length !== 0){	// 20170725 skip empty lists
					targetidx = idxmap[elem_tagname];
					targetlist = categorizeddocresult[targetidx]["document-list"];
					targetlist.push({
						"metadata": doclist[i]["metadata"],
						"termscount": 0,
						"totaloccur": 0,
						"termlist": [],
						"termfreqlist": [],
						"detail": []
					});
					targetres = targetlist[targetlist.length - 1];
					for(j = 0, lj = docres[elem_tagname].length; j < lj; j++){
						wordres = docres[elem_tagname][j];
						targetres["termscount"] += 1;
						targetres["totaloccur"] += wordres["freq"];
						targetres["termlist"].push(wordres["term"]);
						targetres["termfreqlist"].push(wordres["freq"]);
						targetres["detail"].push(wordres["term"] + "(" + wordres["freq"] + ")");
					}
				}
			}	
		}
	}
	
	var date = new Date();
	var timetagstr = date.toISOString().substr(0, 10).replace(/-/g, "") + date.toTimeString().substr(0, 8).replace(/:/g, "");	// 20170731: remove ".csv"
	
	postMessage(JSON.stringify({
		"msgtype": 1,
		"result": {
			"type": type,	// 20170719
			"basicfrequencyresult": result_basicfreq,
			"categorizeddocumentresult": categorizeddocresult,
			"wordclouddata": wordclouddata_arr,	// 20170424
			"xmlattributelist": xml_attrlist,	// 20170719
			"xmldetailresult": result_xmldetail	// 20170719
		},
		"timetag": timetagstr
	}));
	return;
});