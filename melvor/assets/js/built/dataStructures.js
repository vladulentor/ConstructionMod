"use strict";
class MinHeapPriorityQueue {
    constructor(objs, priorities) {
        this._heap = [];
        this._objMap = new Map();
        if (objs.length !== priorities.length)
            throw new Error('Must have the same number of objects as priorities');
        objs.forEach((obj, i) => {
            const elem = [obj, priorities[i], i];
            this._heap.push(elem);
            this._objMap.set(obj, elem);
        });
        this._build();
    }
    get size() {
        return this._heap.length;
    }
    get isEmpty() {
        return this._heap.length === 0;
    }
    /** Builds the min heap from an un-ordered array */
    _build() {
        for (let i = Math.floor(this._heap.length / 2); i--; i >= 0) {
            this._heapify(i);
        }
    }
    /** Performs the min-heapify procedure on the heap at index i. Sifts the element down until the min-heap property is satisfied */
    _heapify(i) {
        const l = this._left(i);
        const r = this._right(i);
        let smallest = l < this.size && this._heap[l][1 /* HeapIndex.Key */ ] < this._heap[i][1 /* HeapIndex.Key */ ] ? l : i;
        if (r < this.size && this._heap[r][1 /* HeapIndex.Key */ ] < this._heap[smallest][1 /* HeapIndex.Key */ ])
            smallest = r;
        if (smallest !== i) {
            this._swap(smallest, i);
            this._heapify(smallest);
        }
    }
    /** Inserts an object with the specified priority */
    insert(obj, priority) {
        const newElem = [obj, Infinity, this.size];
        this._heap.push(newElem);
        this._objMap.set(obj, newElem);
        this._decreaseKey(this.size - 1, priority);
    }
    /** Peeks the object with the lowest priority in the queue */
    peek() {
        const first = this._heap[0];
        return first && first[0 /* HeapIndex.Obj */ ];
    }
    /** Returns if a given object is in the queue */
    inQueue(obj) {
        return this._objMap.has(obj);
    }
    /** Extracts the object with the minimum priority */
    extractMin() {
        if (this.size < 1)
            throw new Error('Heap Underflow');
        const min = this._heap[0];
        const lastElem = this._heap.pop();
        if (!this.isEmpty) {
            if (lastElem !== undefined) {
                this._heap[0] = lastElem;
                lastElem[2 /* HeapIndex.Ind */ ] = 0;
                this._heapify(0);
            }
        }
        this._objMap.delete(min[0 /* HeapIndex.Obj */ ]);
        return min[0 /* HeapIndex.Obj */ ];
    }
    /** Decreases the priority of the specified object to the new priority */
    decreasePriority(obj, newPriority) {
        const heapElem = this._objMap.get(obj);
        if (heapElem === undefined)
            throw new Error('Object is not in the queue.');
        this._decreaseKey(heapElem[2 /* HeapIndex.Ind */ ], newPriority);
    }
    /** Deletes an object from the queue */
    delete(obj) {
        const heapElem = this._objMap.get(obj);
        if (heapElem === undefined)
            throw new Error('Object is not in the queue');
        const lastElem = this._heap[this.size - 1];
        this._swap(this.size - 1, heapElem[2 /* HeapIndex.Ind */ ]);
        this._heap.pop();
        this._objMap.delete(obj);
        if (lastElem[1 /* HeapIndex.Key */ ] > heapElem[1 /* HeapIndex.Key */ ]) {
            this._heapify(heapElem[2 /* HeapIndex.Ind */ ]);
        } else if (lastElem[1 /* HeapIndex.Key */ ] < heapElem[1 /* HeapIndex.Key */ ]) {
            this._siftUp(heapElem[2 /* HeapIndex.Ind */ ]);
        }
    }
    /** Sifts an element i up, until the min heap propery is satisfied */
    _siftUp(i) {
        let iParent = this._parent(i);
        while (i > 0 && this._heap[iParent][1 /* HeapIndex.Key */ ] > this._heap[i][1 /* HeapIndex.Key */ ]) {
            this._swap(i, iParent);
            i = iParent;
            iParent = this._parent(i);
        }
    }
    /** Decrease the key of the specified index in the heap to the new value */
    _decreaseKey(i, key) {
        const heapElem = this._heap[i];
        if (heapElem[1 /* HeapIndex.Key */ ] < key)
            throw new Error('New priority is larger than current priority');
        heapElem[1 /* HeapIndex.Key */ ] = key;
        this._siftUp(i);
    }
    _swap(i, j) {
        this._heap[i][2 /* HeapIndex.Ind */ ] = j;
        this._heap[j][2 /* HeapIndex.Ind */ ] = i;
        [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
    }
    _parent(i) {
        return Math.floor((i - 1) / 2);
    }
    _left(i) {
        return 2 * i + 1;
    }
    _right(i) {
        return 2 * i + 2;
    }
}
class DoublyLinkedList {
    /** If there are no nodes in the list */
    get isEmpty() {
        return this._head === undefined;
    }
    /** Traverses each object, from the start to the end */
    forEachForward(callbackFn) {
        let node = this._head;
        let i = 0;
        while (node !== undefined) {
            const nextNode = node.next;
            callbackFn(node.obj, i);
            i++;
            node = nextNode;
        }
    }
    /** Travereses each object, from the end to the start */
    forEachReverse(callbackFn) {
        let node = this._tail;
        let i = 0;
        while (node !== undefined) {
            const prevNode = node.prev;
            callbackFn(node.obj, i);
            i++;
            node = prevNode;
        }
    }
    /** Traverses forward in the list looking for the first index of an object that matches predicate. Returns -1 if no match found. */
    findIndex(predicate) {
        let node = this._head;
        let i = 0;
        let foundIndex = -1;
        while (node !== undefined) {
            const nextNode = node.next;
            if (predicate(node.obj, i)) {
                foundIndex = i;
                break;
            }
            i++;
            node = nextNode;
        }
        return foundIndex;
    }
    /** Inserts a node after the given node */
    _insertAfter(node, newNode) {
        newNode.prev = node;
        if (node.next === undefined) {
            newNode.next = undefined;
            this._tail = newNode;
        } else {
            newNode.next = node.next;
            node.next.prev = newNode;
        }
        node.next = newNode;
    }
    /** Inserts node before the given node */
    _insertBefore(node, newNode) {
        newNode.next = node;
        if (node.prev === undefined) {
            newNode.prev = undefined;
            this._head = newNode;
        } else {
            newNode.prev = node.prev;
            node.prev.next = newNode;
        }
        node.prev = newNode;
    }
    /** Inserts a node at the start of the list */
    _insertStart(newNode) {
        if (this._head === undefined) {
            this._head = newNode;
            this._tail = newNode;
            newNode.prev = undefined;
            newNode.next = undefined;
        } else
            this._insertBefore(this._head, newNode);
    }
    /** Inserts a node at the end of the list */
    _insertEnd(newNode) {
        if (this._tail === undefined)
            this._insertStart(newNode);
        else
            this._insertAfter(this._tail, newNode);
    }
    /** Removed a node from the list */
    _removeNode(node) {
        if (node.prev === undefined) {
            this._head = node.next;
        } else {
            node.prev.next = node.next;
        }
        if (node.next === undefined) {
            this._tail = node.prev;
        } else {
            node.next.prev = node.prev;
        }
        node.prev = node.next = undefined;
    }
}
class LinkQueue extends DoublyLinkedList {
    constructor() {
        super(...arguments);
        this._objMap = new Map();
    }
    /** The number of objects currently in the queue */
    get size() {
        return this._objMap.size;
    }
    /** Returns if an object is currently in the queue */
    inQueue(obj) {
        return this._objMap.has(obj);
    }
    /** Adds an object to the end of the queue */
    queue(obj) {
        const node = {
            obj,
        };
        this._insertEnd(node);
        this._objMap.set(obj, node);
    }
    /** Removes the first object from the queue and returns it */
    dequeue() {
        const oldHead = this._head;
        if (oldHead === undefined)
            throw new Error('Queue underflow');
        this._removeNode(oldHead);
        this._objMap.delete(oldHead.obj);
        return oldHead.obj;
    }
    /** Deletes an object from the queue */
    delete(obj) {
        const node = this._objMap.get(obj);
        if (node === undefined)
            throw new Error('Object is not in queue');
        this._removeNode(node);
        this._objMap.delete(obj);
    }
    /** Peeks the first object in the queue */
    peek() {
        var _a;
        return (_a = this._head) === null || _a === void 0 ? void 0 : _a.obj;
    }
    /** Removes all objects from the queue */
    clear() {
        this._head = undefined;
        this._tail = undefined;
        this._objMap.clear();
    }
}
class MultiMap {
    constructor(depth) {
        this._size = 0;
        this._depth = 0;
        this._data = new Map();
        this._depth = depth;
    }
    get depth() {
        return this._depth;
    }
    get size() {
        return this._size;
    }
    clear() {
        this._data.clear();
        this._size = 0;
    }
    /** Deletes the value stored at the specified keys */
    delete(...keys) {
        this._checkKeys(keys);
        let curMap = this._data;
        const lastKey = keys.pop();
        let deleteDepth = 0;
        let deleteMap = undefined;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const childMap = curMap.get(key);
            if (childMap === undefined)
                return;
            if (childMap.size === 1 && deleteMap === undefined) {
                deleteDepth = i;
                deleteMap = curMap;
            } else {
                deleteMap = undefined;
            }
            curMap = childMap;
        }
        if (!curMap.has(lastKey))
            return;
        this._size--;
        curMap.delete(lastKey);
        if (deleteMap !== undefined)
            deleteMap.delete(keys[deleteDepth]);
    }
    /**
     * Gets a value stored at the specified keys
     * @param keys Keys to index into the map in order
     * @returns The value at the given keys, or undefined if not set
     */
    get(...keys) {
        this._checkKeys(keys);
        let curMap = this._data;
        const lastKey = keys.pop();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const childMap = curMap.get(key);
            if (childMap === undefined)
                return undefined;
            curMap = childMap;
        }
        return curMap.get(lastKey);
    }
    /**
     * Sets the value stored at the specified keys
     * @param value Value to set at the specified keys
     * @param keys Keys to set the value to in order
     */
    set(value, ...keys) {
        this._checkKeys(keys);
        let curMap = this._data;
        const lastKey = keys.pop();
        keys.forEach((key) => {
            let childMap = curMap.get(key);
            if (childMap === undefined) {
                childMap = new Map();
                curMap.set(key, childMap);
            }
            curMap = childMap;
        });
        if (!curMap.has(lastKey))
            this._size++;
        curMap.set(lastKey, value);
    }
    /**
     * Checks if the map has a value set at the specified keys
     * @param keys Keys to index into the map in order
     * @returns If the map has a value at the specified keys
     */
    has(...keys) {
        return this.get(...keys) !== undefined;
    }
    _checkKeys(keys) {
        if (keys.length !== this._depth)
            throw new Error('Number of keys does not match depth');
    }
}
//# sourceMappingURL=dataStructures.js.map
checkFileVersion('?12097')