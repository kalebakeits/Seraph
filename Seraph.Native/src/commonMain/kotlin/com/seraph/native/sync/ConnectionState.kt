package com.seraph.native.sync

sealed class ConnectionState {
    object Disconnected : ConnectionState()

    object Connecting : ConnectionState()

    object Connected : ConnectionState()

    data class Error(
        val message: String,
    ) : ConnectionState()
}
