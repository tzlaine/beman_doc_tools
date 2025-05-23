import {visit} from 'unist-util-visit'
const impl = require('./code_sampler_impl.js')

const plugin = (options = {}) => {
    if (options.roots === undefined)
        options.roots = impl.default_roots;
    if (options.extensions === undefined)
        options.extensions = impl.default_extensions;
    if (options.line_numbers === undefined)
        options.line_numbers = false;
    if (options.source_line_numbers === undefined)
        options.source_line_numbers = false;

    const transformer = async (ast, vfile) => {
        let regions = null
        visit(ast, 'code', (node) => {
            if (regions === null) {
                regions = impl.get_tagged_regions(
                    impl.get_source_files(options))
            }

            if ((node.lang === 'cpp' || node.lang === 'c++') &&
                node.meta !== null &&
                node.value === '') {
                if (!(node.meta in regions)) {
                    throw Error(`error: ${vfile.path}:${node.position.start.line}: Unknown source tag '${node.meta}'.`)
                }
                var lines = regions[node.meta].map(
                    e => e.text.replace("\t", "    "))
                const space_prefixes = lines.map((e) => {
                    var match = e.match(/^( *)/)
                    return match ? match[1].length : 0
                })
                const common_spaces = space_prefixes.reduce(
                    (result, e) => Math.min(result, e),
                    space_prefixes[0]
                )
                lines = lines.map(e => e.slice(common_spaces))
                node.value = lines.join("\n")
            }
        });
    };

    // TODO: Use the implementation in
    // https://github.com/wcoder/highlightjs-line-numbers.js to enable line
    // numbering, and source line numbers.

    return transformer;
};

export default plugin;
