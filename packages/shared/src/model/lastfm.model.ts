import {z} from "zod"
import {zz} from "shared";

export const artistSchema = z.object({
    mbid: z.string(),
    "#text": z.string()
}).transform(({"#text": text, ...rest}) => ({text, ...rest}));

export const imageSchema = z.object({
    size: z.string(),
    "#text": z.string()
}).transform(({"#text": text, ...rest}) => ({text, ...rest}));

export const albumSchema = z.object({
    mbid: z.string(),
    "#text": z.string()
}).transform(({"#text": text, ...rest}) => ({text, ...rest}));

export const dateSchema = z.object({
    uts: z.string(),
    "#text": z.string()
}).transform(({"#text": text, ...rest}) => ({text, ...rest}));

export const attributeSchema = z.object({
    user: z.string().optional(),
    nowplaying: zz.boolish().optional(),
    totalPages: z.string().optional(),
    page: z.string().optional(),
    perPage: z.string().optional(),
    total: z.string().optional(),
})

export const trackSchema = z.object({
    artist: artistSchema,
    streamable: z.string(),
    image: z.array(imageSchema).length(4),
    mbid: z.string(),
    album: albumSchema,
    name: z.string(),
    url: z.string(),
    date: dateSchema.optional(),
    "@attr": attributeSchema.optional()
}).transform(({"@attr": attr, ...rest}) => ({attr, ...rest}));

export const recentTracksResponseSchema = z.object({
    recenttracks: z.object({
        track: z.array(trackSchema),
        "@attr": attributeSchema.optional()
    })
}).transform((v) => {
    const {recenttracks: {"@attr": attr, ...rest}} = v;
    return {recenttracks: {attr, ...rest}};
});


export type Artist = z.infer<typeof artistSchema>;
export type Image = z.infer<typeof imageSchema>;
export type Album = z.infer<typeof albumSchema>;
export type LastFmDate = z.infer<typeof dateSchema>;
export type Attr = z.infer<typeof attributeSchema>;
export type Track = z.infer<typeof trackSchema>;
export type RecentTracksResponse = z.infer<typeof recentTracksResponseSchema>;