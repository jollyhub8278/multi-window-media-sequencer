package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

const (
	MediaTypeImage = "image"
	MediaTypeVideo = "video"
	MediaTypeBlank = "blank"
)

type Media struct {
	ID              bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Name            string        `bson:"name" json:"name"`
	Type            string        `bson:"type" json:"type"`
	URL             string        `bson:"url,omitempty" json:"url,omitempty"`
	DefaultDuration int           `bson:"default_duration" json:"defaultDuration"`
	CreatedAt       time.Time     `bson:"created_at" json:"createdAt"`
	UpdatedAt       time.Time     `bson:"updated_at" json:"updatedAt"`
}

type PlaylistItem struct {
	ID              bson.ObjectID `bson:"_id" json:"id"`
	MediaID         bson.ObjectID `bson:"media_id" json:"mediaId"`
	Position        int           `bson:"position" json:"position"`
	DisplayDuration int           `bson:"display_duration" json:"displayDuration"`
}

type DisplayWindow struct {
	ID                   bson.ObjectID  `bson:"_id,omitempty" json:"id"`
	Name                 string         `bson:"name" json:"name"`
	Playlist             []PlaylistItem `bson:"playlist" json:"playlist"`
	CycleDurationSeconds int            `bson:"cycle_duration_seconds" json:"cycleDurationSeconds"`
	CreatedAt            time.Time      `bson:"created_at" json:"createdAt"`
	UpdatedAt            time.Time      `bson:"updated_at" json:"updatedAt"`
}

type SyncEvent struct {
	ID              bson.ObjectID `bson:"_id,omitempty" json:"id"`
	MediaID         bson.ObjectID `bson:"media_id" json:"mediaId"`
	DurationSeconds int           `bson:"duration_seconds" json:"durationSeconds"`
	StartsAt        time.Time     `bson:"starts_at" json:"startsAt"`
	EndsAt          time.Time     `bson:"ends_at" json:"endsAt"`
	Status          string        `bson:"status" json:"status"`
	CreatedAt       time.Time     `bson:"created_at" json:"createdAt"`
}
