
/*********************************************************************************************************************
	JavaScript | canvas arrows v.1.0 | updated: 25.10.2013 | author: michael verhov | http://michael.verhov.com | License: GNU GPL
**********************************************************************************************************************/

(function (window, undefined) {

    var $cArrows = function (commonParent, genrealOptions) {
		if (window === this) {
		    return new $cArrows(commonParent, genrealOptions);
		}

        // default options
		this.options = {
		    base: {
		        canvasZIndex: -10,
		        alertErrors: true,
		        putToContainer: true
		        // + : canvasClass, canvasId    n.r.: ~lazy = false
                // n.r.: redraw-recreate then rescale
		    },
            arrow: {
                connectionType: 'rectangleAuto', // : [rectangleAuto,center,ellipseAuto,side,rectangleAngle,ellipseAngle]  n.r.: ~point, ~centerOffset
                arrowType: 'arrow',              // : [arrow,line,] n.r.: ~line(or empty), ~bilateralArrow, ~fillArrow
                arrowSize: 9
            },
            render: {
                lineWidth: 2,
                strokeStyle: '#2D6CA2'
                // + : another canvas options e.g.: shadowColor: 'rgba(0, 0, 0, 0)', shadowBlur: 0, lineJoin: 'round',
            }
		};
		this.CanvasStorage = [[], [], []]; // stack for: [0] - for common nodes; [1] - for canvas; [2] - for drawn arrows [from, to, options]

        // get common parent nodes
		if (typeof commonParent === 'string') {
		    var commonParentResult = document.querySelectorAll(commonParent);
		}
		else
		    this.trowException('common parent must be specified');

		if (commonParentResult.length > 0) {
		    for (var i = 0; i < commonParentResult.length; i++) {
		        this.CanvasStorage[0][i] = commonParentResult[i];
		    }
		    this.CanvasStorage[0].length = commonParentResult.length;
		}
		else
		    this.trowException('common parent not found');

        // extend options
		if (genrealOptions !== undefined) {
		    if (genrealOptions.base !== undefined)
		        extend(this.options.base, genrealOptions.base);
		    if (genrealOptions.render !== undefined)
		        extend(this.options.render, genrealOptions.render);
		    if (genrealOptions.arrow !== undefined)
		        extend(this.options.arrow, genrealOptions.arrow);
		}

        // set up canvas for each node
		for (iParent in this.CanvasStorage[0]) {
		    this.CanvasStorage[0][iParent].style.position = 'relative';
		    var canvas = document.createElement('canvas');
		    canvas.innerHTML = "";
		    canvas.style.position = 'absolute';
		    canvas.style.left = '0px';
		    canvas.style.top = '0px';
		    canvas.style.zIndex = this.options.base.canvasZIndex;
		    canvas.width = this.CanvasStorage[0][iParent].scrollWidth;
		    canvas.height = this.CanvasStorage[0][iParent].scrollHeight;

		    // set identifier, if necessary
		    if (this.options['canvasId'] !== undefined) {    // && commonParentResult.length === 1
		        canvas.id = this.options['canvasId'];
		    }
		    if (this.options['canvasClass'] !== undefined) {
		        canvas.className = this.options['canvasClass'];
		    }

		    this.CanvasStorage[0][iParent].insertBefore(canvas, this.CanvasStorage[0][iParent].firstChild);
		    this.CanvasStorage[1].push(canvas);
		}

		return this;
    };


    function extend(target, source) {
        if (target != null && source != null) {
            for (name in source) {
                if (source[name] !== undefined) {
                    target[name] = source[name];
                }
            }
        }
        return target;
    }
    function getOffset(canvas, childrenEl) {
        var canv = canvas.getBoundingClientRect(),
            box = childrenEl.getBoundingClientRect();

            return {
                top: box.top - canv.top,
                left: box.left - canv.left,
                width: childrenEl.offsetWidth,
                height: childrenEl.offsetHeight
            };
    }
    function DegToRad(deg){
        return deg * (Math.PI / 180);
    }
    function RadToDeg(deg) {
        return deg * (180 / Math.PI);
    }
    function getSideCoord(coods, side) {
        var x = 0, y = 0;

        switch (side) {
            case 'top':
                x = coods.left + (coods.width / 2);
                y = coods.top;
                break;
            case 'right':
                x = coods.left + coods.width;
                y = coods.top + (coods.height / 2);
                break;
            case 'bottom':
                x = coods.left + (coods.width / 2);
                y = coods.top + coods.height;
                break;
            case 'left':
                x = coods.left;
                y = coods.top + (coods.height / 2);
                break;
            default:    // def: bottom
                x = coods.left + (coods.width / 2);
                y = coods.top + coods.height;
                break;
        }
        return { x: x, y: y }
    }
    function getCenterCoord(coods) {
        return {
            x: coods.left + coods.width / 2,
            y: coods.top + (coods.height / 2)
        }
    }
    function getAngleCoord(r, c, angle) {
        var x, y,
            rAngle = Math.acos(
                Math.sqrt(Math.pow(r.left + r.width - c.x, 2)) /
                Math.sqrt(Math.pow(r.left + r.width - c.x, 2) + Math.pow(r.top - c.y, 2))
                );

        if (angle >= 2 * Math.PI - rAngle || angle < rAngle) {
            x = r.left + r.width;
            y = c.y + Math.tan(angle) * (r.left + r.width - c.x);
        } else
            if (angle >= rAngle && angle < Math.PI- rAngle) {
                x = c.x - ((r.top - c.y) / Math.tan(angle));
                y = r.top + r.height;
            } else
                if (angle >= Math.PI - rAngle && angle < Math.PI + rAngle) {
                    x = r.left;
                    y = c.y - Math.tan(angle) * (r.left + r.width - c.x);
                }
                else
                    if (angle >= Math.PI + rAngle) {
                        x = c.x + ((r.top - c.y) / Math.tan(angle));
                        y = r.top;
                    }
        return {
            x: x,
            y: y
        };
    }
    function getEllipseCoord(r, c, angle) {
        return {
            x: c.x + (r.width / 2) * Math.cos(angle),
            y: c.y + (r.height / 2) * Math.sin(angle)
        };
    }
    function canvasDraw(context, p1, p2, otp) { //fromx, fromy, tox, toy
        var headlen = otp.arrowSize;
        var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);

        switch (otp.arrowType) {
            case 'arrow':
                context.moveTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
                context.lineTo(p2.x, p2.y);
                context.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
                break;
            case 'line':
                // line already exist
                break;
            case 'double-headed':
                // start
                context.moveTo(p1.x + headlen * Math.cos(angle - Math.PI / 6), p1.y + headlen * Math.sin(angle - Math.PI / 6));
                context.lineTo(p1.x, p1.y);
                context.lineTo(p1.x + headlen * Math.cos(angle + Math.PI / 6), p1.y + headlen * Math.sin(angle + Math.PI / 6));
                // end
                context.moveTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
                context.lineTo(p2.x, p2.y);
                context.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));

                break;
            default:
                break;
        }
        
        context.stroke();
    }
    function drawArrow(canvas, div1, div2, gRenderOptions, customOptions) {    //, color, lineWidth, shadowColor, shadowBlur , div1side, div2side
        var context = canvas.getContext('2d'),
            arrowOpt = {},
            dot1 = getOffset(canvas, div1),
            dot2 = getOffset(canvas, div2);

        // extend here with custom
        extend(arrowOpt, gRenderOptions.arrow);
        extend(context, gRenderOptions.render);

        if (customOptions !== undefined) {
            if (customOptions.render !== undefined)
                extend(context, customOptions.render);
            if (customOptions.arrow !== undefined)
                extend(arrowOpt, customOptions.arrow);
        }

        switch (arrowOpt.connectionType) {
            case 'rectangleAuto':
                var c1 = getCenterCoord(dot1),
                    c2 = getCenterCoord(dot2);
                dot1 = getAngleCoord(dot1, c1, Math.atan2(c1.y - c2.y, c1.x - c2.x) + Math.PI);
                dot2 = getAngleCoord(dot2, c2, Math.atan2(c2.y - c1.y, c2.x - c1.x) + Math.PI);
                break;
            case 'center':
                dot1 = getCenterCoord(dot1);
                dot2 = getCenterCoord(dot2);
                break;
            case 'ellipseAuto':
                var c1 = getCenterCoord(dot1),
                    c2 = getCenterCoord(dot2);
                dot1 = getEllipseCoord(dot1, c1, Math.atan2(c2.y - c1.y, c2.x - c1.x));
                dot2 = getEllipseCoord(dot2, c2, Math.atan2(c1.y - c2.y, c1.x - c2.x));
                break;
            case 'side':
                dot1 = getSideCoord(dot1, arrowOpt.sideFrom);
                dot2 = getSideCoord(dot2, arrowOpt.sideTo);
                break;
            case 'rectangleAngle':
                dot1 = getAngleCoord(dot1, getCenterCoord(dot1), DegToRad(arrowOpt.angleFrom));
                dot2 = getAngleCoord(dot2, getCenterCoord(dot2), DegToRad(arrowOpt.angleTo));
                break;
            case 'ellipseAngle':
                dot1 = getEllipseCoord(dot1, getCenterCoord(dot1), DegToRad(arrowOpt.angleFrom));
                dot2 = getEllipseCoord(dot2, getCenterCoord(dot2), DegToRad(arrowOpt.angleTo));
                break;
            default: break;
        }

        canvasDraw(context, dot1, dot2, arrowOpt);    // - put type of arrow here
    }


    $cArrows.fn = $cArrows.prototype = {
        trowException: function (ex) {
            if (this.options.base.alertErrors === true)
                alert('CanvasArrows error: ' + ex);
            throw new Error(ex);
        },
        arrow: function (from, to, customOptions) {
            for (iParent in this.CanvasStorage[0]) {
                var fromChildrens = this.CanvasStorage[0][iParent].querySelectorAll(from);
                var toChildrens = this.CanvasStorage[0][iParent].querySelectorAll(to);
                for (var fi = 0; fi < fromChildrens.length; fi++) {
                    for (var ti = 0; ti < toChildrens.length; ti++) {
                        drawArrow(this.CanvasStorage[1][iParent], fromChildrens[fi], toChildrens[ti], this.options, customOptions);
                    }
                    if (this.options.base.putToContainer === true)
                        this.CanvasStorage[2].push([from, to, customOptions]);
                }
            }
            return this;
        },
        arrows: function (arrowsArr) {
            for (var i = 0; i < arrowsArr.length; i++) {
                this.arrow(arrowsArr[i][0], arrowsArr[i][1], arrowsArr[i][2]);
            }
            return this;
        },
        clear: function () {
            for (iCanvas in this.CanvasStorage[1]) {
                var canvas = this.CanvasStorage[1][iCanvas];
                var context = canvas.getContext('2d');
                context.clearRect(0, 0, canvas.width, canvas.height);
            }
            return this;
        },
        draw: function () {
            var putToContainer = this.options.base.putToContainer;
            this.options.base.putToContainer = false;
            for (iArrow in this.CanvasStorage[2]) {
                this.arrow(this.CanvasStorage[2][iArrow][0], this.CanvasStorage[2][iArrow][1], this.CanvasStorage[2][iArrow][2]);
            }
            this.options.base.putToContainer = putToContainer;
            return this;
        },
        redraw: function () {
            return this.clear().draw();
        },
        updateOptions: function (options) {
            if (options.base !== undefined)
                extend(this.options.base, options.base);
            if (options.render !== undefined)
                extend(this.options.render, options.render);
            if (options.arrow !== undefined)
                extend(this.options.arrow, options.arrow);
            return this;
        }
	};

	window.$cArrows = $cArrows;
})(window);