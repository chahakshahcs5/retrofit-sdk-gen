CC ?= gcc
CFLAGS ?= -Wall -Wextra -O2 -Iinclude

SRCS = src/client.c src/services.c
OBJS = $(SRCS:.c=.o)
TARGET = libapp_sdk.a

all: $(TARGET)

$(TARGET): $(OBJS)
	ar rcs $@ $^

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET)

.PHONY: all clean
