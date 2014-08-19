(function() {
	const ONEBYS2PI = 0.3989422804014327;
	
	Ext.Stat = {
		min : function(data) {
			return Ext.Array.min(data);
		},
		
		max : function(data) {
			return Ext.Array.max(data);
		},
		
		mean : function(data) {
			return Ext.Array.mean(data);
		},
		
		stddev : function(data, mean) {
			if(!(data instanceof Array) || data.length < 1)
				throw new Error('Data should be instance of Array and have one or more than elements.');
				
			if(!mean) {
				mean = this.mean(data);
			}
			var variance = Ext.Array.sum(Ext.Array.map(data, function(v) {
				return Math.pow(v - mean, 2);
			})) / data.length;

			return Math.sqrt(variance);
		},
		
		minunit : function(val) {
			if(val == 0)
				return 1;
				
			var temp = val;
			var minunit;
			
			if(Math.abs(temp) >= 1) {
				minunit = 0;
				while(true) {
					temp /= 10;
					if(Math.floor(temp) == 0) {
						temp = val;
						for(var i = 1;i <= minunit;i++) {
							temp /= 10;
						}
						temp = Math.floor(temp) + 0.5;
						for(var i = 1;i <= minunit;i++) {
							temp *= 10;
						}
						return {
							minunit : minunit,
							value : temp
						};
					} else {
						minunit++;
					}
				}
			} else {
				minunit = 1;
				while(true) {
					temp *= 10;
					if(Math.floor(temp) == 0) {
						temp = val;
						for(var i = 1;i <= minunit;i++) {
							temp *= 10;
						}
						temp = Math.floor(temp) + 0.5;
						for(var i = 1;i <= minunit;i++) {
							temp /= 10;
						}
						return {
							minunit : minunit,
							value : temp
						};
					} else {
						minunit++;
					}
				}
			}
		},
		
		dnormal : function(x, mu, sigma) {
			if(sigma <= 0)
				return null;
			
			var temp = (x - mu) * (x - mu) / (sigma * sigma);
			return ONEBYS2PI * Math.exp(-0.5 * temp);
		}
	}
})();