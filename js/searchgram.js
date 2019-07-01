// 20170622 general.js required.

function TermSearcher(){
	var prefix = "_";
	var mainlist = [];
	var maxlen = 0, minlen = 0;
	
	this.getTermLengthInfo = function(){
		return {"max": maxlen, "min": minlen};
	}
	
	// 20170622: Can't handle duplication on mainterm now.
	// 20170703: Simplified (remove synonym/alias functions)
	this.addTermListByCSV = function(name, csv){
		var i, li, j, lj;
		var content = csv.split(/\r\n|\r|\n|,/g);	// three types of newlines, and half-size comma
		var termstr;
		var synonymstridx, synonymstr;
		var tmp_synonymlist = [], tmp_synonymgroup = {};
		var termlistgroup = {}, termlistarr = [];
		var tmp_mainterm = "";
		
		var result = {};
		
		for(i = 0, li = content.length; i < li; i++){
			termstr = content[i];
			if(termstr !== "" && result[prefix + termstr] === undefined) {
				result[prefix + termstr] = termstr;
				if(termstr.length > maxlen){
					maxlen = termstr.length;
				}
				if(termstr.length < minlen || minlen === 0){
					minlen = termstr.length;
				}
			}
		}
		
		mainlist.push({ "name": name, "terms": result});
		return;
	};
	
	this.searchTerms = function(s){
		var result = [];
		var i, li;
		var elem_list;
		var tmp_termresult;
		
		for(i = 0, li = mainlist.length; i < li; i++){
			elem_list = mainlist[i];
			tmp_termresult = elem_list.terms[prefix + s];
			if(tmp_termresult !== undefined){
				result.push({ "category": elem_list.name, "term": tmp_termresult });
			}
		}
		return result;
	};
};

/*
	Structure of searchTerms():
	[
		{category, term},
	...]
*/

// Search Gram in Single Text.
function GramSearcherFromText(){
	var normalizeText = function(text, punc){
		return depunch_2(text, punc);	// require general.js
	};
	
	// Structure: {{gram, length, count}, ...}
	var formNgramList = function(ntext, punc, min, max){
		var segments = ntext.split(punc);
		var segment = "";
		var tmpgram = "";
		var result = {};
		var i, j, k;
		
		for(i = 0; i < segments.length; i++){
			segment = segments[i];
			for(j = min; j <= max; j++){	// n-gram length
				// substr() Start Index, keep moving to the next index until string with length j can't sliced from that point
				for(k = 0; k + j <= segment.length; k++){
					tmpgram = segment.substr(k, j);
					if(result[tmpgram]){
						result[tmpgram]["count"] += 1;
					} else {
						result[tmpgram] = {"gram": tmpgram, "length": tmpgram.length, "count": 1};
					}
				}
			}
		}
		
		return result;
	};
	
	this.searchGram = function(text, punc, clist, min, max){
		var min = (Number.isInteger(min) && min > 0) ? min : 2;
		var max = (Number.isInteger(max) && max > 0) ? (max > min) ? max : min : 20;
		var ngramlist = formNgramList(normalizeText(text, punc), punc, min, max);
		var result_normal = [], result_categorized = [];
		var i, li, j, lj;
		var elem_ngram, elem_termresult;
		var prev_catname = undefined;
		
		// Adjust length range based on clist
		var clistleninfo = clist.getTermLengthInfo();
		min = (clistleninfo.min > min) ? clistleninfo.min : min;
		max = (clistleninfo.max < max) ? clistleninfo.max : max;
		
		for(elem_ngram in ngramlist){
			result_normal = result_normal.concat(clist.searchTerms(ngramlist[elem_ngram]["gram"]));
		}
		
		result_normal.sort(function(a, b){	// sort by category name
			return a.category > b.category;
		});
		
		for(i = 0, li = result_normal.length; i < li; i++){
			elem_termresult = result_normal[i];
			elem_termresult["freq"] = ngramlist[elem_termresult["term"]]["count"];	// add term frequency
			if(elem_termresult["category"] !== prev_catname){
				result_categorized.push({
					"category": elem_termresult["category"],
					"termlist": []
				});
				prev_catname = elem_termresult["category"];
			}
			result_categorized[result_categorized.length - 1]["termlist"].push(elem_termresult);
		}
		// sort termlist by frequency
		for(i = 0, li = result_categorized.length; i < li; i++){
			result_categorized[i]["termlist"].sort(function(a, b){
				return b.freq - a.freq;
			});
		}
		
		return {"result-normal": result_normal, "result-categorized": result_categorized};
	};
}

function GramSearcherFromXml(){
	var my = this;
	
	my.searchInXml = function(doc, filterinfo, vlist){
		var tagnamelist = filterinfo.tagnames || [];
		var taggings = doc.taggings || {};
		var i, li, j, lj, key_tagname, elem_taggedlist;	// taggedcontentkey, taggedcontent, elem_result, result_word;
		var elem_taginfo, elem_termname, filterresult, tmp_searchresult;
		var result_normal = {};
		var result_categorized = {};
		var tmp_termlist = [];
		
		if(taggings === undefined || Object.keys(taggings).length === 0){
			return {};
		}
		
		for(i = 0, li = tagnamelist.length; i < li; i++){
			result_normal[tagnamelist[i]] = [];
			result_categorized[tagnamelist[i]] = {};
		}
		
		for(key_tagname in taggings){
			if(tagnamelist.indexOf(key_tagname) >= 0){
				elem_taggedlist = taggings[key_tagname];
				for(i = 0, li = elem_taggedlist.length; i < li; i++){
					elem_taginfo = elem_taggedlist[i];
					if(vlist[key_tagname] === undefined || vlist[key_tagname].searchTerms(elem_taginfo.text).length !== 0){	// with filter(synonym) list
						result_normal[key_tagname].push(elem_taginfo);
						if(result_categorized[key_tagname][elem_taginfo.text] === undefined){
							result_categorized[key_tagname][elem_taginfo.text] = 0;
						}
						result_categorized[key_tagname][elem_taginfo.text] += 1;
					}
				}
			}
		}
		
		for(key_tagname in result_categorized){
			tmp_termlist = [];
			for(elem_termname in result_categorized[key_tagname]){
				tmp_termlist.push({
					"term": elem_termname,
					"freq": result_categorized[key_tagname][elem_termname]
				});
			}
			tmp_termlist.sort(function(a, b){ return b.freq - a.freq; });
			result_categorized[key_tagname] = tmp_termlist;
		}
		
		return { "result-normal": result_normal, "result-categorized": result_categorized };
	}
}