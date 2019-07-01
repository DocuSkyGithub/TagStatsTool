/*
    This function split a string by three or more consecutive '='.
	It returns a split string array.
*/
var splitchapter = function(text){
	return text.split(/={3,}/);
}

/*  
	This function finds out all hanzi sentences and substitute other characters with specified punctuations(punc).
    It returns a transformed string from 'text'.
    Consecutive punctuations will be replaced by single punc. Ex: "「李白曰：『床前明月光，疑是地上霜。』」" --> "。李白曰。床前明月光。疑是地上霜。"
*/
var depunch = function(text, punc){
	// This regular expression will out all consecutive series of hanzi characters.
	var unihanzireg = new RegExp("[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]+", "g");	// 20170731: remove "u" flag (for older browsers)
	var sentence_tmp = "";
	var result = punc;	// Put the specified punctuation at the head of the string.
	
	while(true){
		sentence_tmp = unihanzireg.exec(text);
		if(sentence_tmp == null){
		  break;
		}
		result = result + sentence_tmp + punc;
	}
	
	return result;
}

var depunch_2 = function(text, punc){
	var puncrange = /[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E\u00A1-\u00BF\u00D7\u00F7\u200B-\u2927\u202A-\u202E\u2030-\u205E\u2060-\u2069\u3001-\u303F\uFE10-\uFF19\uFE30-\uFE4F\uFE50-\uFE6B\uFF00-\uFFEF\s]+/g;	// 20170731: remove "u" flag (for older browsers)
	return text.replace(puncrange, punc);
}

function arraysum(arr){
	return arr.reduce(function(pv, cv, cidx, a){
		return pv + cv;}, 0);
}


/*
	Find out all strings meet the given regular expression pattern.
	Overlapping is handled if 'overlapped' is set to true.
*/
function findall(pattern, text, overlapped){
	var regex = new RegExp(pattern, "g");	// 20170731: remove "u" flag (for older browsers)
	var result = [];
	
	if(overlapped){
		while(match = regex.exec(text)){
			// exec returns an array with single element if matching string is found
			result.push(match[0]);
			// manipulate search index in RegExp object
			// so that overlapped can be found
			regex.lastIndex = match.index + 1;
		}
	}
	else{
		while(match = regex.exec(text)){
			result.push(match[0]);
		}
	}
	
	return result;
}

/*
	Calculate occurence of substr in mainstr.
	Overlapping occurence is considered if 'overlapped' is set to true.
*/
function stringoccur(mainstr, substr, overlapped){
	return findall(substr, mainstr, overlapped).length;
}

/*
	Transfer elements in an array to set form, in which no duplicated element exist.
	(Assume that all elements in the array are of the same type (primitive))
*/
function arraytoset(arr){
	// return [...(new Set(arr))];    <- NOT SUPPORTED BY IE
	var set = {};
	for(var i = 0; i < arr.length; i++){
		set[arr[i]] = 0; 
	}
	return Object.keys(set);
}

/* 
	Return two array's intersection based on arr1. (All elements in arr2 which exist in arr1.)
	Repetitions will not be handled.
	Example: arr1 = [3, 3, 4, 5] arr2 = [3, 5, 5] result = [3, 3, 5] 
*/
function arrintersect(arr1, arr2){
	var result = [];
	for(var i = 0; i < arr1.length ; i++){
		if(arr2.indexOf(arr1[i]) != -1){
			result.push(arr1[i]);
		}
	}
	return result;
}

/* Since arrmerge() uses arraytoset(), contents in the array don't repeat */
function arrmerge(arr1, arr2){
	return arraytoset(arr1.concat(arr2));
}

function is_array(val){
	return val &&
		typeof val === 'object' &&
		typeof val.length === 'number' &&
		typeof val.splice === 'function' &&
		!(val.propertyIsEnumerable('length'));
}

function checkarrallposint(arr){
	if (!is_array(arr)) {
		return false;
	}
	if(arr.length === 0){
		return false;
	}
	for(var i = 0; i < arr.length; i++){
		if(!Number.isInteger(arr[i]) || arr[i] < 1){
			return false;
		}
	}
	return true;
}

function checkarrallstr(arr){
	if(!is_array(arr)){
		return false;
	}
	if(arr.length === 0){
		return false;
	}
	for(var i = 0; i < arr.length; i++){
		if(typeof(arr[i]) !== "string"){
			return false;
		}
	}
	return true;
}

// Remove all space(\s), tab(\t), newline(\r, \n, \r\n) in a string.
function removeblank(str){
    return str.replace(/\r|\n|\t|\s/gm, "");
}

// Remove all newline with space.
function removenewline(str){
	return str.replace(/\r|\n/gm, " ");
}

// IE polyfill 20161026
Number.isInteger = Number.isInteger || function(value) {
  return typeof value === "number" && 
    isFinite(value) && 
    Math.floor(value) === value;
};

if (!Array.prototype.fill) {
  Array.prototype.fill = function(value) {

    // Steps 1-2.
    if (this == null) {
      throw new TypeError('this is null or not defined');
    }

    var O = Object(this);

    // Steps 3-5.
    var len = O.length >>> 0;

    // Steps 6-7.
    var start = arguments[1];
    var relativeStart = start >> 0;

    // Step 8.
    var k = relativeStart < 0 ?
      Math.max(len + relativeStart, 0) :
      Math.min(relativeStart, len);

    // Steps 9-10.
    var end = arguments[2];
    var relativeEnd = end === undefined ?
      len : end >> 0;

    // Step 11.
    var final = relativeEnd < 0 ?
      Math.max(len + relativeEnd, 0) :
      Math.min(relativeEnd, len);

    // Step 12.
    while (k < final) {
      O[k] = value;
      k++;
    }

    // Step 13.
    return O;
  };
}

if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      // We must check against these specific cases.
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}