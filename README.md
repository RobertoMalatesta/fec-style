## Campaign finance for everyone
The Federal Election Commission (FEC) releases information to the public about money that’s raised and spent in federal elections — that’s elections for US president, Senate, and House of Representatives. 

Are you interested in seeing how much money a candidate raised? Or spent? How much debt they took on? Who contributed to their campaign? The FEC is the authoritative source for that information.

betaFEC is a collaboration between [18F](http://18f.gsa.gov) and the FEC. It aims to make campaign finance information more accessible (and understandable) to all users. 

## FEC repositories 
We welcome you to explore our FEC repositories, make suggestions, and contribute to our code. Our repositories are:

- [FEC](https://github.com/18F/fec): a general discussion forum. We [compile feedback](https://github.com/18F/fec/issues) from betaFEC’s feedback widget here, and this is the best place to submit general feedback.
- [openFEC](https://github.com/18F/openfec): betaFEC’s API
- [openFEC-web-app](https://github.com/18f/openfec-web-app): the betaFEC web app for exploring campaign finance data
- [fec-style](https://github.com/18F/fec-style): shared styles and user interface components
- [fec-cms](https://github.com/18F/fec-cms): the content management system (CMS) for betaFEC

## How you can help
We’re thrilled you want to get involved! Here are some suggestions:
- Check out our [contributing guidelines](https://github.com/18F/openfec/blob/master/CONTRIBUTING.md). Then, [file an issue](https://github.com/18F/fec/issues) or submit a pull request.
- [Send us an email](mailto:betafeedback@fec.gov).
- If you’re a developer, follow the installation instructions in the README.md page of each repository to run the apps on your computer. 

## Copyright and licensing
This project is in the public domain within the United States, and we waive worldwide copyright and related rights through [CC0 universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/). Read more on our license page.

A few restrictions limit the way you can use FEC data. For example, you can’t use contributor lists for commercial purposes or to solicit donations. Learn more on FEC.gov.

---

[![Build Status](https://img.shields.io/travis/18F/fec-style/master.svg)](https://travis-ci.org/18F/fec-style)
[![Test Coverage](https://img.shields.io/codecov/c/github/18F/fec-style/master.svg)](https://codecov.io/github/18F/fec-style)

### View the style guide
Clone the repo to your machine and open `styleguide/index.html`. Voila.

### Install dependencies

    $ npm install

Eventually we'll have a sweet build process for this all. In the mean time, we're using node-sass and kss-node to compile the Sass and generate the styleguide.

Watch the sass, build css and styleguide:

    $ npm run watch

Generate the CSS:

    $ npm run build-sass

Generate the JS:

    $ npm run build-js

Run unit tests:

    $ npm test

Watching the Sass:

    $ npm run watch-sass

Note: in order for css changes to be visible on the styleguide, you need to run `npm run copy-css`, which will copy it to the styleguide directory.

Generate the styleguide once:

    $ npm run build

And then we're using a custom template for the styleguide, which lives in
`fec-template/`. To make style changes to the template, you need to edit
`kss.less` and then run:

    $ npm run build-styleguide

Host the styleguide on a local server:

    $ npm install http-server
    $ http-server

To upload screenshots to [percy.io](https://percy.io):

    $ gem install percy
    $ npm run percy

### Use KSS
We use the KSS standard for documenting our Sass. This is both readable to humans and can be used to automatically generate styleguides. Here's an example:

```
// Buttons
// A button suitable for giving stars to someone.
//
// Markup:
// <button>Button</button>
// <button class="primary">Primary Button</button>
//
// :hover             - Subtle hover highlight.
// .primary           - The primary action button
// .disabled          - Dims the button to indicate it cannot be used.
//
// Styleguide 2.1.3.
//
```
