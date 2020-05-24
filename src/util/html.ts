import * as sax from 'sax';
import { Link } from '../link';
import { resolve } from './uri';

type ParseHtmlResult = {

  links: Link[],
  forms: {
    action: string,
    method: string | null,
    enctype: string | null,
    rel: string | null,
    id: string | null,
  }[];

}

export function parseHtml(contextUri: string, body: string): ParseHtmlResult {

  const parser = sax.parser(false, {});
  const links: Link[] = [];
  const forms: ParseHtmlResult['forms'] = [];

  parser.onopentag = node => {

    switch(node.name) {
      case 'LINK' :
      case 'A' :
        links.push(...parseLink(contextUri, node as sax.Tag));
        break;
      case 'FORM' :
        forms.push(...parseForm(contextUri, node as sax.Tag));
        break;

    }

  };

  parser.write(body).close();

  return {
    forms,
    links,
  };

}

function parseLink(contextUri: string, node: sax.Tag): Link[] {

  if (!node.attributes.REL) {
    return [];
  }
  if (!node.attributes.HREF) {
    return [];
  }

  const rels = <string> node.attributes.REL;

  const links: Link[] = [];
  for (const rel of rels.split(' ')) {

    const type = <string>node.attributes.TYPE;
    const link: Link = {
      rel,
      context: contextUri,
      href: <string> node.attributes.HREF,
    };
    if (type) link.type = type;
    links.push(link);
  }

  return links;

}

function parseForm(contextUri: string, node: sax.Tag): ParseHtmlResult['forms'] {

  const rels = node.attributes.REL || null;
  const id = node.attributes.ID || null;
  const action = node.attributes.ACTION || '';
  const method = node.attributes.METHOD || 'GET';
  const enctype = node.attributes.ENCTYPE || 'application/x-www-form-urlencoded';

  if (!rels) {
    return [{
      rel: null,
      id,
      action: resolve(contextUri, action),
      method,
      enctype,
    }];
  }

  const result = [];

  for(const rel of rels.split(' ')) {

    result.push({
      rel,
      id,
      action: resolve(contextUri, action),
      method,
      enctype,
    });

  }
  return result;

}
