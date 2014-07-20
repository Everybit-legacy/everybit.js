/** @jsx React.DOM */

var Slider = React.createClass({

    handleChangeSlide: function() {
        var curr = puffworldprops.slider.currentSlide;
        curr = (curr % this.state.totalSlides) + 1;

        console.log(curr);

        return events.pub( 'ui/slider/currSlide',{ 'slider.currSlide': curr});

    },

    handleHideSlider: function() {
        return events.pub( 'ui/slider/close',{ 'slider.show': false});
    },


    render: function() {
        var slidesArr = new Array();
        for(i=1;i<=puffworldprops.slider.totalSlides;i++) {
            slidesArr.push(i)
        }


        if(puffworldprops.slider.show) {
            var cn = "slider"
        } else {
            var cn = "invisible";
        }

        // TODO: if invisible, short-circuit all the rest

        var w = window.innerWidth;
        var h = window.innerHeight;

        if( (w/h) < 3/2) {
            // Width drives it
            var slideW = Math.round(w *.75);
            var slideH = Math.round(slideW/1.5);

        } else {
            // Height drives it
            var slideH = Math.round(h *.75);
            var slideW = Math.round(slideH*1.5);
        }

        var sliderStyle = {width: slideW+'px',height: slideH+'px', backgroundColor: '#FFFFFF'};
        var self = this;

        var slideName;

        switch (puffworldprops.slider.currentSlide) {
            case 1:
                slideName = <WelcomeSlide />
                break;
            case 2:
                slideName = <ShortcutsSlide />
                break;
            case 3:
                slideName = <SecureSlide />
                break;
            case 4:
                slideName = <MultiThreadedSlide />
                break;
            case 5:
                slideName = <FilteringSlide />
                break;
            case 6:
                slideName = <IdentitySlide />
                break;
            case 7:
                slideName = <InteroperableSlide />
                break;
            default:
                break;
        }

        return (
            <div className={cn} style={sliderStyle}>
                <img src="img/slides/SlideHeader.gif" style={{width: '100%'}} />
                <a href="#" onClick={this.handleHideSlider}>
                    <i className="fa fa-times-circle-o fa-fw closeBox"></i>
                </a>
                <div className="slide">
                    {slideName}
                </div>
                <div className="sliderFooter">
                        {slidesArr.map(function(i) {
                            return <SliderBullet active={i == puffworldprops.slider.currentSlide} numb={i} />
                        })} <a href="#"><em>Get started!</em></a>
                </div>
            </div>
            );
    }
});


var SliderBullet = React.createClass({
    handleGotoSlide: function() {

        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': this.props.numb});


    },


    render: function() {
        if(this.props.active) {
            return <a href="#" onClick={this.handleGotoSlide}><i className="fa fa-fw fa-circle blue"></i></a>
        } else {
            return <a href="#" onClick={this.handleGotoSlide}><i className="fa fa-fw fa-circle-thin"></i></a>
        }
    }

});

var WelcomeSlide = React.createClass({

    handleGotoSlide: function(goTo) {
        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': goTo});
    },

    render: function() {
        return (
                <div>
                	<a href="#" onClick={this.handleGotoSlide.bind(this,2)} className="black"><i className="blue fa fa-fw fa-plane"></i> Keyboard <em className="blue">shortcuts</em> for everything.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,3)} className="black"><i className="blue fa fa-fw fa-lock"></i> Fully <em className="blue">secure</em> communications</a><br />

                    <a href="#" onClick={this.handleShowSlide} className="black"><i className="blue fa fa-fw fa-plane"></i> Keyboard <em className="blue">Multi-threaded</em> conversations.</a><br />

                    <a href="#" onClick={this.handleShowSlide} className="black"><i className="blue fa fa-fw fa-search-plus"></i> Advanced <em className="blue">filtering</em> tools.</a><br />

                    <a href="#" onClick={this.handleShowSlide} className="black"><i className="blue fa fa-fw fa-user"></i> Full <em className="blue">identity</em> management.</a><br />

                    <a href="#" onClick={this.handleShowSlide} className="black"><i className="blue fa fa-fw fa-beer"></i> Open source. Decentralized. <em className="blue">Interoperable</em>.</a><br />
                    </div>

            )

    }
})

var ShortcutsSlide = React.createClass({
    render: function() {
        return (
            <div>
                <span className="blue bold">N</span>: Begin a new post<br />

                <span className="blue" bold>CMD-ENTER</span>: Publish your post<br />

                <span className="blue" bold>←↑↓→</span>: Navigate between posts<br />

                <span className="blue" bold>I</span>: Toggle show informaiton about posts<br />

                <span className="blue" bold>SPACE</span>: Toggle show relationships<br />

                <span className="blue" bold>ESC</span>: Close a dialogue box (including this one!)<br />

                <em>See full list</em><br />
            </div>

            )

    }
})

var SecureSlide = React.createClass({
    render: function() {
        return (
            <div>
                SECURE<br />
            </div>

            )

    }
})

var MultiThreadedSlide = React.createClass({
    render: function() {
        return (
            <div>
            Multi-threaded<br />
            </div>

            )

    }
})

var FilteringSlide = React.createClass({
    render: function() {
        return (
            <div>
            Filtering<br />
            </div>

            )

    }
})

var IdentitySlide = React.createClass({
    render: function() {
        return (
            <div>
            Indentity<br />
            </div>

            )

    }
})


var InteroperableSlide = React.createClass({
    render: function() {
        return (
            <div>
            Interoperable<br />
            </div>

            )

    }
})


// Needed
// (X) Initial state
// (X) Function to change to next image
// Hover to click to next one
// Hover left and right to go backwards and forwards (if on right half, show chevron right, if on left half, show chevron left)
// Sliding of images
// (P) Array of slides, needs to have alt-text for each one
// Bind to changeSlide +1 or -1
// (X) Way to hide slider with click in upper right
// Hide this from registered viewers
// Have way to see it explicitly from menu
// Mouse over tooltips on images to preview or get the alt tag for that slide

