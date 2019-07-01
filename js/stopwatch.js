window.Stopwatch = function(){
	// whether the stopwatch is running
	var running = false;
	var paused = false;
	
	var starttime;
	var pausetime = 0;
	var pausestart;
	
	// start the timer
	this.start = function(){
		if(running || paused) return -1;
		
		starttime = new Date().getTime();
		running = true;
		return starttime;
	}
	
	this.pause = function(){
		if(!running) return -1;
		
		pausestart = new Date().getTime();
		running = false;
		paused = true;
		return pausestart;
	}
	
	this.resume = function(){
		if(!paused || running) return -1;
		
		var e = new Date().getTime() - pausestart;
		pausetime += e;
		paused = false;
		running = true;
		return e;
	}
	
	// get current elapse time
	// type -
	//		0: seconds, 1: milliseconds, 2: returns an object with number values{Hour, Minute, Second},
	//		3: returns an object with string values{Hour, Minute, Second}
	this.getTime = function(type){
		if(!running && !paused) return -1;
		
		var t, result;
		
		if (!paused){
			t = (new Date().getTime() - starttime - pausetime);
		} else {
			t = (pausestart - starttime - pausetime);
		}
		
		if (type === 0 || type === 2 || type === 3){
			t = Math.floor(t / 1000);
		}
		
		switch (type){
			case 0, 1:
				result = t;
				break;
			case 2:
				result = {
					"Hour": Math.floor(t / 3600),
					"Minute": Math.floor(t / 60),
					"Second": t % 60
				};
				break;
			case 3:
				result = {
					"Hour": Math.floor(t / 3600).toString(),
					"Minute": (Math.floor(t / 60) >= 10) ? Math.floor(t / 60).toString() : "0" + Math.floor(t / 60).toString(),
					"Second": (t % 60 >= 10) ? (t % 60).toString() : "0" + (t % 60).toString()
				};
				break;
			default:
				result = t = Math.floor(t / 1000);
				break;
		}
		return result;
	}
	
	// get current time
	this.stop = function(type){
		if(!running && !paused) return -1;
		
		var e = this.getTime(type);
		pausetime = 0;
		running = false;
		paused = false;
		return e;
	}
	
	this.isRunning = function(){
		return running;
	}
	this.isPaused = function(){
		return paused;
	}
}