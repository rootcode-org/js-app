### box model
margin auto can be used to center horizontally, but not vertically
top/bottom margin specified as a percentage is relative to *width* of containing element
vertical margins collapse, except for absolute and inline-block elements

### position:
relative establishes containing element for descendents
absolute element is not included in flow
fixed is relative to viewport

### display:
block elements stack vertically - sized based on sizing attributes
inline elements flow horizontally - sized based purely on content
inline-block elements flow horizontalls - sized based on sizing attributes
inline-block contains an automatic right margin; add the following to remove;
    margin-right: -4px;
