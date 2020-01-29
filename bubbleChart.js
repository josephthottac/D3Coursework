/* eslint-disable linebreak-style */
/**
 * Enables the creation of word frequency bubble chart instances which support hoverable elements,
 * different colour ranges, and changing text sizes.
 * <p> Sample Data used was taken from word frequency analyses of
 * {@link https://github.com/taubergm/TrumpTweets/blob/master/trump_words.csv|Trump's Tweets} and the
 * {@link https://www.sporcle.com/games/MrChewypoo/dobby-ranked-322-and-quidditch-was-327|Harry Potter books}.
 * Source code was inspired by the work of
 * {@link https://gist.github.com/alokkshukla/3d6be4be0ef9f6977ec6718b2916d168#file-readme-md|Alok Shukla}
 * and {@link https://elliotbentley.com/2017/08/09/a-better-way-to-structure-d3-code-es6-version.html|Elliot Bentley}<p>
 * @constructor
 * @param {object} data - Data taken is in a similar format to that of a JSON file:
 * {"children": [{"Name": "Word", Count: 999}, {"Name": "Another Word", Count: 100}...]}.
 * @param {object} element - The HTML element that the bubble chart will be appended to.
 * Most common to insert into a 'div' element
 * @param {string} colour - Choose from a selection of 'Teal', 'Orange' or 'Grey'.
 * Other colours can be added by adapting the method setColour
 */
class BubbleChart {
  constructor(opts) {
    // load in arguments
    this.rawData = opts.data;
    this.element = opts.element;
    this.colour = opts.colour;
  }

  /**
  * Appends a new SVG element that uses the size of the document to dictate its size.
  * Also calls other methods which create bubbles and add other visual componenets
  * @property {integer} width Equal to the width of HTML element
  * @property {integer} height Width divided by 1.35 (can be adjusted)
  * @property {object} svg SVG element that holds a series of <g> tags (one for each bubble)
  */
  makeSVG() {
    // Defines width, height and margin
    this.width = this.element.offsetWidth;
    this.height = this.width / 1.35;
    this.margin = {
      top: 60,
      right: 75,
      bottom: 45,
      left: 50,
    };

    // Sets up parent element and SVG
    this.element.innerHTML = '';
    this.svg = d3.select(this.element).append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // These method calls can be removed if fewer visual components are desired
    this.formatData();
    this.addBubbles();
    this.addText();
    this.setColour(this.colour);
    this.addHoverElements(100, 500, 1.3, 900);

    d3.select(window).on('resize', () => {
      this.makeSVG();
    });
  }

  /**
  * Uses D3 methods to manipulate raw data into a format that can be easily transformed
  * into bubble chart
  * @property {object} d3Data Formatted data - also contains properties for each
  *  bubble's coordinates
  */
  formatData() {
    const formatted = d3.hierarchy(this.rawData).sum((d) => d.Count);
    const bubble = d3.pack();
    bubble.size([this.width, this.height]);
    bubble.padding(2);
    this.d3Data = bubble(formatted);
  }

  /**
  * Sets bubble chart and document background colours depending on given input. More colours can be
  * used by adding another conditional expression to the selection structure
  * @param {string} colour A one-word long string that corresponds to a pair of colours
  * @property {function} colourRange A function that creates a scale from one colour to another
  * with a linear relationship betwen input (position of datum) and output (colour)
  */
  setColour(colour) {
    let twoColours = new Array(2);
    let background = '';
    if (colour === 'Orange') {
      twoColours = ['orange', 'brown'];
      background = 'rgb(48, 4, 4)';
    } else if (colour === 'Teal') {
      twoColours = ['teal', 'darkslateblue'];
      background = 'rgb(32, 20, 70)';
    } else if (colour === 'Grey') {
      twoColours = ['slategrey', 'darkslategrey'];
      background = 'rgb(18, 26, 18)';
    }
    document.body.style.background = background;
    this.colourRange = d3.scaleLinear().domain([1, 100]).range(twoColours);
    this.nodes.select('circle').transition().style('fill', (d, i) => this.colourRange(i));
  }

  /**
  * Takes formatted data and creates a <g> tag for each word. Uses the 'transform' attribute to
  * move each node to its coordinates and follows this by creating a circle with a radius
  * dependant on count.
  * @property {object} nodes A collection of all nodes (or <g> tags) in the bubble chart
  */
  addBubbles() {
    this.nodes = this.svg.selectAll('g')
      .data(this.d3Data.descendants())
      .enter()
      .filter((d) => !d.children)
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    this.nodes.append('circle')
      .attr('r', (d) => d.r);
  }

  /**
  * Uses D3's hover mouse event to add a degree of interactability to the bubble chart. Code adapted
  * from http://jonathansoma.com/tutorials/d3/clicking-and-hovering/
  * @param {integer} hvrInNodeTime Transition duration (for colour/size) for a bubble you hover over
  * @param {integer} hvrInOthersTime Transition duration (for size) for all other bubbles when you
  * hover over a bubble
  * @param {double} hvrInNodeSizeMultiplier Dictates change in size of a bubble you hover over
  * @param {integer} hvrOutOthersTime Transition duration (for colour/size) for all other bubbles
  * when you stop hovering over a bubble
  */
  addHoverElements(hvrInNodeTime, hvrInOthersTime, hvrInNodeSizeMultiplier, hvrOutOthersTime) {
    const chart = this;
    this.nodes = this.svg.selectAll('g')
      .on('mouseover', function (d) {
        d3.select(this.parentNode).selectAll('circle')
          .transition()
          .duration(hvrInOthersTime)
          .attr('r', 0);
        d3.select(this).select('circle')
          .transition()
          .duration(hvrInNodeTime)
          .attr('r', d.r * hvrInNodeSizeMultiplier)
          .style('fill', chart.colourRange(0));
        chart.changeTextSize(this, d.r, 0.6);
      })
      .on('mouseout', function (d, i) {
        d3.select(this.parentNode).selectAll('circle')
          .transition()
          .duration(hvrOutOthersTime)
          .attr('r', (d) => d.r)
          .style('fill', (d, i) => chart.colourRange(i));
        chart.changeTextSize(this, d.r, 0.4);
      });
  }

  /**
  * Changes size of both text elements inside bubble and adds a transition
  * @param {object} object - Holds the bubble whose text size is to be changed
  * @param {double} radius - Current radius of bubble
  * @param {double} multiplier - Dictates change in size of text
  */
  changeTextSize(object, radius, multiplier) {
    this.newText = d3.select(object).selectAll('text')
      .transition()
      .attr('font-size', radius * multiplier);
  }

  /**
  * Takes formatted data and creates two text elements for each word: one for count and another
  * for the word itself. Uses the coordinates created by D3's pack method to decide where each
  * bubble's text should go. Depending on the size of the bubble, some characters may be ommitted
  * from the text element to stop spillage outside the bubble.
  */
  addText() {
    this.nodes.append('title')
      .text((d) => `${d.data.Name}: ${d.data.Count}`);

    this.nodes.append('text')
      .attr('dy', '-.05em')
      .style('text-anchor', 'middle')
      .text((d) => d.data.Name.substring(0, d.r / 3.2))
      .attr('font-size', (d) => d.r * 0.4)
      .attr('fill', 'white');

    this.nodes.append('text')
      .attr('dy', '1.3em')
      .style('text-anchor', 'middle')
      .text((d) => d.data.Count)
      .attr('font-size', (d) => d.r * (1 / 3))
      .attr('fill', 'white');
  }
}
